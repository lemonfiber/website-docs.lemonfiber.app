---
title: Where does my issue go?
description: One question decides which of the eleven repositories your report belongs in — and if it does not, file it anywhere.
sidebar: { order: 3 }
---

Eleven repositories, and no reason you should know the split. So the short
answer first: **if you cannot tell, file it anywhere.** Routing is a
maintainer's job, not a reporter's, and a misrouted issue is far better than one
nobody files. Issues are transferred rather than closed and refiled, so the
history, your attribution and any discussion survive the move.

If you would like to route it yourself, one question does most of the work.

## The question

**Does the software behave the way the specification says it should?**

| Your answer                      | Where it goes           | Why                                             |
| -------------------------------- | ----------------------- | ----------------------------------------------- |
| No                               | The implementation repo | It is a defect against a stated requirement     |
| Yes, but that behaviour is wrong | `spec`                  | The specification is wrong, so it changes first |
| The spec says nothing about it   | `spec`                  | It is a gap                                     |
| I cannot tell                    | Anywhere                | A maintainer routes it                          |

## Worked examples

| Symptom                                               | Repository                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A command crashes                                     | `lemonfiber`                                                                           |
| A service will not start                              | `lemonfiber-media-stack`                                                               |
| The Homebrew formula installs the wrong version       | `homebrew-tap`                                                                         |
| The wizard asks something only an expert could answer | `spec` — the specification forbids it, and if it does not, the specification is wrong  |
| "It should also do X"                                 | `spec` — a feature request is a spec change                                            |
| An unhelpful error message                            | `lemonfiber` if it breaks the error model, `spec` if the error model does not cover it |
| A VPN provider is unsupported                         | `spec` — the capability model changes first                                            |

If you are not sure which repository owns a given piece of the system,
[the repository map](/develop/repo-map/) says what each of the eleven is for.

## Feature requests always start at the specification

An idea about what lemonfiber should do is a proposed change to what lemonfiber
should do, and that is settled before code is written. Filing it against an
implementation repository invites exactly the sequence the project is built to
prevent: somebody implements it, and then the specification is written to match.

You do not need to phrase it as a requirement. Describe the problem and the
behaviour you would want. If you would like the full flow — including how your
issue becomes a Draft requirement without you touching git — see
[proposing a change](/contributing/rfcs/).

## Security reports do not go in issues

**Not through a public issue.** Use the private disclosure path in
[reporting a vulnerability](/contributing/reporting-a-vulnerability/), which
also says what is in scope and what is deliberately not defended.

Security fixes are the main legitimate use of the
[override](/spec/50-governance/overrides/) on the citation rule, because a
specification pull request announcing what is being patched must not land before
the patch does.

## When an issue spans several repositories

File it against `spec`, and it becomes the parent. Tracking issues are opened in
each affected implementation repository. The spec issue closes when the
specification is settled; the tracking issues close as the work lands.

This mirrors an obligation running the other way: a specification change that
alters accepted behaviour has to name the repositories it affects, and those
statements are what the tracking issues are made from.

## Before you file

Say what you expected, what happened instead, and which version you are on. If a
running stack is involved, attach a support bundle —
[`lemonfiber support`](/fixing/the-support-bundle/) writes one locally, redacts
credentials on the way, and sends it nowhere by itself. Read it before you
attach it.

## Related

- [Where to ask](/contributing/where-to-ask/) — the four destinations, including conversation
- [Issue routing](/spec/50-governance/issue-routing/) — the normative version of this page
- [Fixing things](/fixing/) — before you file, in case it is already answered
- [The repository map](/develop/repo-map/) — what each of the eleven repos owns
