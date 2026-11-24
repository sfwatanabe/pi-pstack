import assert from "node:assert/strict";
import { test } from "node:test";
import { pushDecision } from "./push-policy.ts";

const featurePush = "git push --no-follow-tags origin HEAD:refs/heads/pi/topic";

test("pushes require confirmation by default", () => {
  assert.equal(pushDecision(featurePush, "confirm"), "confirm");
});

test("feature-only allows standalone pushes with an explicit feature destination", () => {
  for (const command of [featurePush, "git push -u --no-follow-tags origin topic:refs/heads/topic", "git push --no-follow-tags origin main:refs/heads/topic"]) {
    assert.equal(pushDecision(command, "feature-only"), "allow", command);
  }
});

test("feature-only blocks recognizable direct pushes to main", () => {
  for (const command of ["git push origin main", "git push origin HEAD:main", "git push origin HEAD:refs/heads/main"]) {
    assert.equal(pushDecision(command, "feature-only"), "block", command);
  }
});

test("feature-only does not exempt destructive, ambiguous, or compound commands", () => {
  for (const command of [
    "git push",
    "git push origin topic",
    "git push origin HEAD:refs/heads/topic",
    "git push origin HEAD:topic",
    "git push --mirror origin",
    "git push --force-with-lease origin HEAD:refs/heads/topic",
    "git push origin +HEAD:refs/heads/topic",
    "git push origin :refs/heads/topic",
    `${featurePush} HEAD:refs/heads/main`,
    `${featurePush} && gh pr merge 1`,
    `${featurePush}\n gh pr merge 1`,
    "git push origin HEAD:refs/heads/$BRANCH",
  ]) {
    assert.equal(pushDecision(command, "feature-only"), "confirm", command);
  }
});
