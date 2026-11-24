import assert from "node:assert/strict";
import { test } from "node:test";
import { APPROVAL_MODE_ENTRY, isApprovalMode, sessionApprovalMode, shellApproval, type ApprovalMode } from "./shell-approval.ts";

const featurePush = "git push --no-follow-tags origin HEAD:refs/heads/pi/topic";

test("confirm is default for gated commands; auto skips their prompts", () => {
  for (const [command, operation] of [
    [featurePush, "git push"],
    ["gh pr merge 123", "GitHub pull-request mutation"],
    ["gt create", "Graphite mutation"],
    ["terraform apply", "infrastructure mutation"],
    ["kubectl apply -f service.yaml", "Kubernetes mutation"],
    ["vercel deploy", "deployment"],
    ["rm -rf generated/", "recursive deletion"],
  ]) {
    assert.deepEqual(shellApproval(command, "confirm"), { kind: "confirm", operation });
    assert.deepEqual(shellApproval(command, "confirm", "auto"), { kind: "allow" });
    assert.deepEqual(shellApproval(command, "confirm", "confirm"), { kind: "confirm", operation });
  }
});

test("plain commits, read-only git commands, and PR creation stay ungated", () => {
  for (const command of ['git commit -m "Update docs"', "git status", "git diff", "gh pr create"]) {
    assert.deepEqual(shellApproval(command, "confirm"), { kind: "allow" });
  }
});

test("auto also skips prompts caused by quoted command text", () => {
  const command = 'git commit -m "Document git push"';
  assert.deepEqual(shellApproval(command, "confirm"), { kind: "confirm", operation: "git push" });
  assert.deepEqual(shellApproval(command, "confirm", "auto"), { kind: "allow" });
});

test("feature-only keeps its push exemption and direct-main block", () => {
  assert.deepEqual(shellApproval(featurePush, "feature-only"), { kind: "allow" });
  assert.deepEqual(shellApproval("git push origin HEAD:main", "feature-only"), { kind: "block-main" });
  assert.deepEqual(shellApproval("git push origin HEAD:main", "feature-only", "auto"), { kind: "block-main" });
});

test("feature-only blocks recognizable force pushes and deletions of main in both approval modes", () => {
  for (const command of [
    "git push -f origin main",
    "git push --force origin HEAD:refs/heads/main",
    "git push --no-follow-tags --force-with-lease origin HEAD:refs/heads/main",
    "git push --force-with-lease=refs/heads/main:abc123 origin HEAD:main",
    "git push origin +HEAD:refs/heads/main",
    "git push origin :refs/heads/main",
    "git push --delete origin main",
  ]) {
    assert.equal(shellApproval(command, "feature-only", "confirm").kind, "block-main", command);
    assert.equal(shellApproval(command, "feature-only", "auto").kind, "block-main", command);
  }
  const feature = "git push --force-with-lease origin HEAD:refs/heads/topic";
  assert.equal(shellApproval(feature, "feature-only", "confirm").kind, "confirm");
  assert.equal(shellApproval(feature, "feature-only", "auto").kind, "allow");
});

test("resuming honors the last setting, but a fork before revocation requires a fresh opt-in", () => {
  const command = "rm -rf generated/";
  const entry = (id: string, parentId: string | null, data: unknown) => ({
    type: "custom" as const,
    customType: APPROVAL_MODE_ENTRY,
    id,
    parentId,
    timestamp: "2026-01-01T00:00:00.000Z",
    data,
  });
  const optIn = (sessionId: string, mode: ApprovalMode) => ({ sessionId, mode });
  const auto = entry("1", null, optIn("original", "auto"));
  const confirm = entry("2", "1", optIn("original", "confirm"));
  const forkAuto = entry("3", "1", optIn("fork", "auto"));
  assert.equal(sessionApprovalMode([auto], "original"), "auto");
  assert.equal(sessionApprovalMode([auto, confirm], "original"), "confirm");
  assert.equal(shellApproval(command, "confirm", sessionApprovalMode([auto], "fork")).kind, "confirm");
  assert.equal(shellApproval(command, "confirm", sessionApprovalMode([auto, forkAuto], "fork")).kind, "allow");
  assert.equal(sessionApprovalMode([entry("4", null, "auto")], "original"), "confirm");
});

test("only explicit supported modes are accepted", () => {
  assert.equal(isApprovalMode("confirm"), true);
  assert.equal(isApprovalMode("auto"), true);
  for (const value of ["off", "status", "", undefined, true, { mode: "auto" }]) {
    assert.equal(isApprovalMode(value), false);
  }
});
