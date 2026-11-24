export type PushPolicy = "confirm" | "feature-only";

export function isPushPolicy(value: unknown): value is PushPolicy {
  return value === "confirm" || value === "feature-only";
}

export function pushDecision(command: string, policy: PushPolicy): "allow" | "confirm" | "block" {
  if (policy === "confirm") return "confirm";

  // Only exempt a standalone push with a named remote and an explicit destination.
  // Shell expressions, additional refspecs, and unknown flags fall back to confirmation.
  const match = /^git[ \t]+push[ \t]+(?:(?:-u|--set-upstream)[ \t]+)?[A-Za-z0-9][A-Za-z0-9._-]*[ \t]+([A-Za-z0-9][A-Za-z0-9._/-]*:)?(refs\/heads\/)?([A-Za-z0-9][A-Za-z0-9._/-]*)$/.exec(command.trim());
  if (!match) return "confirm";
  const [, source, heads, destination] = match;
  if (destination === "main") return "block";
  return source && heads ? "allow" : "confirm";
}
