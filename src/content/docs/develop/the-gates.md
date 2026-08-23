---
title: The gates
description: Every check a pull request meets before it can merge, what each one defends, and why none of them is advisory.
sidebar: { order: 2 }
---

Every rule this project holds code to is either mechanically enforced or
explicitly marked as a matter of judgment. A standard that is neither is
decoration: it gets cited when convenient, ignored under deadline pressure, and
produces the inconsistency it was written to prevent. So most of what follows is
a check, and every check blocks the merge.

## The order they run in

The pipeline is ordered cheapest first, so a formatting mistake does not wait on
a compile.

| Stage            | What it asks                                                                       |
| ---------------- | ---------------------------------------------------------------------------------- |
| `spec-check`     | Is there a citation, does it resolve, and did the spec change land first?          |
| `dco`            | Is every commit signed off by its author?                                          |
| Format           | Has the formatter been run?                                                        |
| Lint             | Does the strict lint set pass with warnings as errors?                             |
| Architecture     | Are the module boundaries intact, and the comment policy obeyed?                   |
| Unit and golden  | Does the logic hold, and is the constructed command byte-for-byte what was agreed? |
| Integration      | Does it work against mocked Docker and mocked service APIs?                        |
| Secret scan      | Is there a credential in any tracked file?                                         |
| Dependency audit | Any advisory, disallowed licence, banned crate, or telemetry?                      |
| Coverage         | Is every applicable line covered?                                                  |
| Static analysis  | Did the analyser find anything at all?                                             |
| End-to-end       | Where Docker is available, do the forms actually boot?                             |

The full pipeline and its requirements are in
[CI and CD](/spec/40-quality/ci-cd/).

## The ones that surprise people

### `spec-check` closes your pull request, it does not just fail it

A missing or unresolvable citation closes the pull request with an explanation
and instructions, rather than leaving a red check sitting there: a check that
can never go green tells a contributor nothing about whether to wait. Closing is
a clear signal with a clear remedy, reopening costs one click, and nothing is
thrown away — the work is sequenced, not rejected. See
[cite the spec](/contributing/cite-the-spec/).

### Coverage is one hundred per cent

Not a target — a gate. What keeps it honest is the **scope** rather than a lax
threshold: the applicable set is defined by explicit, reviewable exclusions
annotated in the source, covering generated code, trivial derivations,
rendering, command-line wiring, unreachable arms and end-to-end-only paths. An
exclusion is a line somebody has to read and agree with; a silent gap is not
allowed, and the number is never to be inflated by testing trivial code. See
[the testing strategy](/spec/40-quality/testing-strategy/).

### Zero open static-analysis issues

Any open issue — bug, vulnerability or code smell — blocks the merge. That is
enforced as its own step rather than by the analyser's own quality gate,
because the free plan's gate cannot be configured to this project's standard and
relying on it would let a substandard change through.

### There are no lint suppressions

There are exactly two legal responses to a lint finding: change the code, or
change the rule, with a documented reason at the crate root, reviewed. A local
suppression in `src/` is not a third option, and an architecture test fails the
build on its presence — a suppression does not answer a finding, it hides one,
in the place least likely to be looked at again. Test code is exempt.

### The comment gate is run against deliberate violations

The comment policy runs as an architecture test, and also against a tree of
planted violations: it must catch each one and pass the compliant control. A
gate that only ever runs over production source passes vacuously on a young
repository, and nobody notices when it stops working.

## Checks that run everywhere

Beyond the Rust pipeline, every repository in the org runs the same hygiene and
security set: workflow linting, spell checking, link checking, markdown linting,
secret scanning, dependency vulnerability scanning, static application security
testing, and a public supply-chain posture check on the default branch.

Every tool in that set is free for public repositories or open source, and that
is a requirement rather than an accident: a paid tier is not available to an
open project on a free org. Two consequences follow. Shared workflows are
**called, not copied**, so they cannot drift; shared lint configuration is
copied, because a linter reads the tree it is given, and a separate job fails
any copy that no longer matches its one home. And dependency updates carry the
`GOV-R12` trailer automatically, so the bot's pull requests pass `spec-check`
unattended. The inventory is in [tooling](/spec/40-quality/tooling/).

## Before CI: the definition of done

CI checks what a machine can. The checklist before the pull request opens is
longer, and it is the author's to run: the cited requirements actually
satisfied rather than approximately, tests on new behaviour, a remedy on every
user-facing error, no panic on an error path, a non-interactive equivalent for
anything interactive, and repository-specific _how_ in `.docs/` rather than
inline.

"Done" explicitly excludes deferred work, suppressed lints, panicking paths and
promised follow-up spec changes. That last one is drift with a promise attached,
which is the precise thing the citation rule exists to prevent. The whole list is
[the definition of done](/spec/40-quality/definition-of-done/).

## What the reviewer adds

A review that only re-runs what CI already ran adds nothing. Two questions are
left to a person:

1. **Does the code actually satisfy the requirement it cites?** CI confirms the
   citation resolves. Only a human confirms the behaviour matches it.
2. **Is anything here a judgment-rule violation?** A redundant comment, a
   premature abstraction, a runtime check where a type would do. None are
   machine-detectable; all block a review.

Every repository carries a task runner with the same named tasks, so you run
locally what the pipeline runs, and the pre-commit hooks mirror CI exactly
without enforcing anything CI does not. A clean local run means something.

## Related

- [CI and CD](/spec/40-quality/ci-cd/) — the pipeline, stage by stage
- [Definition of done](/spec/40-quality/definition-of-done/) — the checklist before the pull request
- [Code standards](/spec/40-quality/code-standards/) · [Code comments](/spec/40-quality/code-comments/)
- [Security](/spec/40-quality/security/) — the threats these checks are defending against
- [Cite the spec](/contributing/cite-the-spec/) — the first gate, and the one that closes
