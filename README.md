# pi-pstack

A Pi-native port of [pstack](https://github.com/cursor/plugins/tree/main/pstack). It includes all 44 upstream skills and their references, playbooks, and scripts, plus Pi implementations of `poteto-agent` and `comment-sicko`.

## Install

Install this fork:

```bash
pi install git:github.com/sfwatanabe/pi-pstack@v0.1.1
```

Then restart Pi. Use `pi config` to enable or disable package resources.

## Start

```text
/setup-pstack
/poteto-mode investigate and fix the retry regression, then verify it
/poteto-mode off
```

`/setup-pstack` is an extension command. It interactively maps pstack roles to models that Pi has configured and saves the result in `~/.pi/agent/pstack/models.json`.

`/poteto-mode` enables sticky Poteto Mode for the current Pi session and expands the bundled `poteto-mode` skill. `/poteto-mode off` disables it. Individual skills use Pi's standard form, for example `/skill:how` and `/skill:no-comments`.

## Pi subagents

The extension registers a `subagent` tool using Pi's official isolated-process pattern. A child runs as a separate `pi --mode json --print --no-session` process and returns only its final result to the parent context.

Bundled agents:

- `poteto-agent` for pstack implementation and investigation delegates. It must read the full `poteto-mode` skill before working.
- `comment-sicko` for comment-only review.

The tool supports a single task, `tasks` for parallel work, and `chain` for sequential work with `{previous}` interpolation. It accepts `role` for the model configuration and `model` for a one-off `provider/model` override. It permits at most eight tasks and runs at most four concurrently.

It also honors Pi's subagent definition locations:

- `~/.pi/agent/agents/*.md` for user agents.
- `.pi/agents/*.md` for project agents, only with `agentScope: "project"` or `"both"`.

Bundled agents are the default. Project agents require interactive approval unless `confirmProjectAgents: false` is explicit.

## Safety and compatibility

This port deliberately removes Cursor-only setup and behavior:

| Cursor pstack behavior | Pi equivalent |
|---|---|
| `Task` and `subagent_type` | `subagent` tool and Markdown agent definitions |
| Cursor model slugs and rules | `/setup-pstack`, `pstack_config`, and Pi `provider/model` selectors |
| sticky `mode: true` | session-persisted `/poteto-mode` extension command |
| Cursor todo list | `pstack_todo` tool |
| Cursor transcript directories | `$PI_SESSION_FILE` and `pstack_sessions` |
| `/loop`, cloud-agent resume | explicit project watchers; child Pi processes are local and fresh |
| Cursor Team Kit skills | capability detection and project-native verification tooling |

Opening a PR from an already-pushed feature branch does not require confirmation. The extension still requests confirmation for recognizable shell commands that push, edit or close PRs, merge, deploy, mutate infrastructure, or recursively delete files. In non-interactive mode it blocks those commands. This is a guardrail, not a complete shell-security sandbox. Prompts require explicit approval for other external or irreversible actions, with this session-level push exception:

- `/pstack-push confirm` restores the default: prompt for pushes.
- `/pstack-push feature-only` skips confirmation for standalone pushes like `git push origin HEAD:refs/heads/my-feature`. It blocks recognizable standalone pushes to `main`. Force pushes, deletions, and ambiguous or combined push commands still require confirmation. Never push directly to `main`.
- `/pstack-push status` shows the current policy. The setting survives session resume and does not change merge approval.

The upstream `watch-pr` and orchestration helper scripts are retained. Their runtime requirements remain project-specific. In particular, the script package uses Bun and GitHub workflows require `gh` authentication.

## License and provenance

Derived from Cursor's pstack, licensed under MIT. See [LICENSE](LICENSE).
