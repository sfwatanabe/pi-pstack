import assert from "node:assert/strict";
import { test } from "node:test";
import { isApprovalMode, shellApproval } from "./shell-approval.ts";

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

test("only explicit supported modes are accepted", () => {
  assert.equal(isApprovalMode("confirm"), true);
  assert.equal(isApprovalMode("auto"), true);
  for (const value of ["off", "status", "", undefined, true, { mode: "auto" }]) {
    assert.equal(isApprovalMode(value), false);
  }
});
