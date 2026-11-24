# pi-pstack

A Pi-native port of [pstack](https://github.com/cursor/plugins/tree/main/pstack). It includes all 44 upstream skills and their references, playbooks, and scripts, plus Pi implementations of `poteto-agent` and `comment-sicko`.

## Install

Install this fork:

```bash
pi install git:github.com/sfwatanabe/pi-pstack@v0.2.1
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

### Shell approvals

By default, pi-pstack prompts before recognizable shell commands that push, edit or close PRs, merge, deploy, mutate infrastructure, or recursively delete files. Without an interactive UI, it blocks commands that would prompt. Plain `git commit` and opening a PR from an already-pushed branch do not require shell approval. This is a guardrail, not a shell-security sandbox.

- `/pstack-approval auto` skips pi-pstack's shell confirmation prompts, including for destructive commands.
- `/pstack-approval confirm` restores the default.
- `/pstack-approval status` shows the current mode.

The mode is saved in the current Pi session and survives resume. New sessions, including forks, default to `confirm`. Auto mode doesn't change other extensions' prompts, project-agent prompts, or explicit approvals required by your project's workflow.

For a narrower exception, `/pstack-push feature-only` skips confirmation for standalone pushes like `git push --no-follow-tags origin HEAD:refs/heads/my-feature`. The `feature-only` policy blocks recognizable standalone pushes to `main`, including common force and deletion forms, even in `auto` mode. Other force pushes, deletions, and ambiguous or combined push commands still prompt in `confirm` approval mode. Never push directly to `main`. Use `/pstack-push status` to inspect the push policy and `/pstack-push confirm` to restore the default push policy.

The upstream `watch-pr` and orchestration helper scripts are retained. Their runtime requirements remain project-specific. In particular, the script package uses Bun and GitHub workflows require `gh` authentication.

## License and provenance

Derived from Cursor's pstack, licensed under MIT. See [LICENSE](LICENSE).
