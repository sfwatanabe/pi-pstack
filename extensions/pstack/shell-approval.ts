import { pushDecision, type PushPolicy } from "./push-policy.ts";

export type ApprovalMode = "confirm" | "auto";

export function isApprovalMode(value: unknown): value is ApprovalMode {
  return value === "confirm" || value === "auto";
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
