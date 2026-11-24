import type { SessionManager } from "@earendil-works/pi-coding-agent";
import { pushDecision, type PushPolicy } from "./push-policy.ts";

export const APPROVAL_MODE_ENTRY = "pstack-approval-mode";

export type ApprovalMode = "confirm" | "auto";

export function isApprovalMode(value: unknown): value is ApprovalMode {
  return value === "confirm" || value === "auto";
}

export function sessionApprovalMode(entries: readonly ReturnType<SessionManager["getEntries"]>[number][], sessionId: string): ApprovalMode {
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];
    if (entry?.type !== "custom" || entry.customType !== APPROVAL_MODE_ENTRY) continue;
    const data: unknown = entry.data;
    // Pi copies custom entries into forks. Only this session's opt-ins count.
    if (typeof data === "object" && data !== null && "sessionId" in data && data.sessionId === sessionId &&
        "mode" in data && isApprovalMode(data.mode)) return data.mode;
  }
  return "confirm";
}

type ShellApproval =
  | { kind: "allow" }
  | { kind: "confirm"; operation: string }
  | { kind: "block-main" };

const externalWrites: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bgh\s+(?:(?:-R\s+|--repo[=\s]+)\S+\s+)?pr\s+(edit|merge|close)\b/, "GitHub pull-request mutation"],
  [/\bgt\s+(submit|merge|create)\b/, "Graphite mutation"],
  [/\b(terraform|tofu)\s+(apply|destroy)\b/, "infrastructure mutation"],
  [/\bkubectl\s+(apply|delete|rollout)\b/, "Kubernetes mutation"],
  [/\b(vercel|flyctl|railway)\s+(deploy|promote)\b/, "deployment"],
  [/\brm\s+(-[A-Za-z]*r|--recursive)/, "recursive deletion"],
  [/\bgit\s+push\b/, "git push"],
];

export function shellApproval(command: string, pushPolicy: PushPolicy, mode: ApprovalMode = "confirm"): ShellApproval {
  const operation = externalWrites.find(([pattern]) => pattern.test(command))?.[1];
  if (!operation) return { kind: "allow" };
  if (operation === "git push") {
    const decision = pushDecision(command, pushPolicy);
    if (decision === "block") return { kind: "block-main" };
    if (decision === "allow") return { kind: "allow" };
  }
  return mode === "auto" ? { kind: "allow" } : { kind: "confirm", operation };
}
