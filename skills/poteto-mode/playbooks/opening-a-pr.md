### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main; subagents inherit it. Multiple `subagent` calls on the same branch each get their own worktree, or `git fetch && git reset --hard origin/<branch>` between them. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally.

**Commits.** Commit liberally; rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit; new commit when separable.

**PRs.** a manual diff cleanup pass the diff before commit; `/skill:no-comments` the diff before review; apply the **unslop** skill to the PR description and commit bodies. Small PRs, 5 narrow over 1 fat; stack follow-ups, branch off main only for genuinely independent work. For stacked PRs, use whatever stacking tool your team uses; the principle is small, ordered slices with the stack visible to reviewers. `gh pr view <number>` before referencing PR status. Rebase on `main` before substantial stack work. No `## Summary` / `## Test plan` boilerplate on small PRs; commit bodies don't restate the subject. After opening, follow the review steps below. Use Babysit when asked to check or drive PR status.

#### Push and review before merge

1. Push the feature branch and open a PR. Never push directly to `main`. Standalone PRs and stack roots target `main`; stacked children target their parent branch.
2. After pushing, have an independent subagent that did not write the change review the PR's base-to-head diff. Give it the pushed head SHA and ask it to look for regressions, edge cases, and missing tests. Have it return actionable findings with file and line references, or state that it found none.
3. Post the subagent's review as PR comments, including the reviewed SHA, even if there are no findings. If the subagent cannot post, the parent posts on its behalf. Fix valid findings and reply to comments with the fix or a concrete reason for disagreeing. Leave unresolved blockers open.
4. Push fixes and repeat review and posting for the new head. Any head change requires a posted review of that head. Merge through the PR only after blocking feedback is resolved, required checks pass, and the user authorizes the merge. Follow [Shipping](shipping.md) for stacks. Get explicit approval for pushes and GitHub writes as required by Poteto Mode's Autonomy rules.

A subagent that opens a PR runs `interrogate`, a manual diff cleanup pass, and `/skill:no-comments`, then returns the URL. The parent owns the independent review loop and any Babysit work.
