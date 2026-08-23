---
title: Cite the spec
description: The one rule every change here obeys, the three cases you are likely to be in, and what happens when a citation is missing.
sidebar: { order: 1 }
---

[The specification](/spec/) is canonical. Every change to an implementation
repository cites at least one identifier that already exists on the spec
repository's default branch.

That is the whole rule. It exists so the specification cannot fall behind the
code: you cannot cite a requirement that has not been merged yet, so the spec is
structurally incapable of becoming a stale description of something else. The
normative statement, and the reasoning behind it, is
[the canonical spec page](/spec/50-governance/canonical-spec/).

## What you can cite

| Kind            | Looks like        | Lives in                                               |
| --------------- | ----------------- | ------------------------------------------------------ |
| Requirement     | `A2-R4`, `C9-R13` | [The feature catalogue](/spec/10-functional/features/) |
| Decision        | `ADR-0006`        | [The decision record](/spec/00-overview/decisions/)    |
| Governance rule | `GOV-R12`         | [The governance section](/spec/50-governance/)         |
| Architecture    | `ARCH-R44`        | [The architecture section](/spec/20-architecture/)     |
| Quality rule    | `Q-R12`           | [The quality section](/spec/40-quality/)               |
| Per-repo rule   | `REPO-R18`        | [The repository specs](/spec/30-repos/)                |
| Operations rule | `OPS-R31`         | [The operations section](/spec/70-operations/)         |
| Brand rule      | `DES-R21`         | [The brand section](/spec/60-brand/)                   |

A requirement identifier reads as feature, then requirement number: `A2-R4` is
the fourth requirement of feature `A2`. Every one of them sits in a table at the
foot of its feature page. The other six requirement namespaces work the same
way — a table at the foot of the page that owns the rule.

Most changes cite a feature requirement, because most changes are about what the
product does. The rest are for changes that are not: a crate boundary is `ARCH-R`,
a lint or a coverage gate is `Q-R`, one repository's own structure is `REPO-R`,
releasing and version manifests are `OPS-R`, and a checkable visual constraint is
`DES-R`.

## Which case are you in?

### You are implementing something already specified

The common case, and the easy one. Find the requirement, cite it, write the
code:

```
feat: health-gate service startup

Spec: B2-R1, B2-R2
```

Put the same identifiers in the pull request body. That is the whole ceremony.

### You want to change how the product behaves

Open a specification pull request **first**. It is usually small — one row in a
requirements table and a paragraph describing the behaviour. Once it merges,
open your implementation pull request citing the new identifier.

The extra step separates _should the product do this?_ from _is this code good?_
Reviewed together, working code tends to win the first question by default,
because working code is persuasive. Reviewed apart, the design is judged on its
own merits. The full ordering is in
[the change lifecycle](/spec/50-governance/change-lifecycle/).

If you do not have repository access, you do not need it — see
[proposing a change](/contributing/rfcs/).

### You are bumping a dependency, fixing a typo, or touching CI

Cite `GOV-R12`:

```
chore: bump tokio to 1.48

Spec: GOV-R12
```

### You found a bug

A bug is behaviour that contradicts the specification, so cite the requirement
it violates. If the specification says nothing about it, that is a gap: open a
spec pull request describing what should happen, then fix it.

## Where the citation goes

In a `Spec:` trailer on at least one commit, **and** in the pull request body.
The two are asked for separately because they serve different readers: the
trailer is permanent provenance in `git log`, the body is context for the person
reviewing.

One valid citation is enough, however large the change. The check counts
references, not coverage.

## Two things not to do

**Do not put identifiers in code comments.** Not as a breadcrumb, not once.
Provenance in a comment rots the moment the requirement it names is superseded,
and the next reader gains nothing from it. Code links to its repository's own
`.docs/` pages, and those pages cite the spec.

**Do not cite a Draft requirement.** Draft means undecided. If you are
implementing it, it should be Accepted first.

## What happens if you skip it

A `spec-check` job runs on every pull request. It reads your commits and body,
extracts the citations, and resolves them against the spec repository at your
merge-base. A missing, invented, mistyped or withdrawn identifier means the pull
request is **closed with guidance** rather than left failing — a red check that
sits indefinitely tells you nothing about whether to wait.

Closing is not rejection. The comment names what is missing, gives you the line
to paste, and reopening costs one click. Nothing is thrown away. The mechanics
are in [cross-repo CI](/spec/50-governance/cross-repo-ci/).

There is an [override](/spec/50-governance/overrides/) for the cases where
following the process would cause harm rather than delay — an embargoed security
fix, a broken bot. It is recorded permanently, it is only for this one rule, and
it is not available to contributors.

## If you disagree with the rule

Say so, in an issue on the spec repository or in the pull request itself. The
rule is written down precisely so that it can be argued with, and changing it is
itself a spec pull request.

## Related

- [How change gets in](/contributing/how-change-gets-in/) — the org's own guide
- [Sign-off and licensing](/contributing/sign-off-and-licensing/) — the other thing every commit needs
- [The gates](/develop/the-gates/) — every check a pull request meets
- [Contributing](/spec/50-governance/contributing/) — the normative version of this page
