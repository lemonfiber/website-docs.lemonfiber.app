---
title: The version train
description: How a lemonfiber release comes together — goals locked before the work, and a gate that refuses to ship until every one of them is proven.
sidebar: { order: 3 }
---

Releases here run as a train: one version in flight at a time, its goals fixed
before the work starts, and a gate that refuses to tag until every goal is
demonstrably built.

The reason is the same one that shapes everything else in this project. The
specification leads the code on a single change; a release is that rule at a
larger grain. **A version's goals are a set of accepted requirements**, chosen
and locked before the work is called done, and the release does not ship until
each of them is shown to have landed.

## One file per version

Each version is a machine-readable manifest, and it is the single source of
truth. Staging writes it, the tracker reads it, the gate checks it, and the
release finalises it.

| Field               | What it holds                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `version`           | The semantic version, matching the tag it will eventually carry                                               |
| `status`            | Where the version is in its lifecycle                                                                         |
| `released_on`       | The day it was published, written by the release rather than typed                                            |
| `repos`             | The release streams this version cuts                                                                         |
| `satisfied_in`      | Where the gate searches for citations; absent, it searches the streams it cuts                                |
| `goals`             | The locked list of accepted requirement identifiers it must satisfy                                           |
| `released_as`       | The tag the goals actually shipped under, where a patch closed the line                                       |
| `withdrawn_because` | Why a shipped release was taken back, in one sentence — required on a yanked manifest and present on no other |
| `pins`              | The exact submodule commits embedded, recorded when it ships                                                  |

The file, not the CI history, answers "where is this version": you read its
status. The manifests and their contract are in
[the versions directory](/spec/70-operations/versions/).

## The lifecycle

A version moves `planned → staged → releasable → released`, optionally through
`in_progress`, with `yanked` as the one terminal exit after release. Every
transition is recorded in the manifest.

Outside hotfixes the train is **serial**: at most one version is staged or
releasable at a time, and staging refuses to start another while one is still in
flight. Two minors never compete for the same trunk or the same pool of goals.

## Locking the goals

A version's goals are seeded from the roadmap milestone it serves, expanded to
the requirement identifiers that milestone's deliverables cite, then trimmed or
extended by a maintainer before the lock.

A goal must be an **accepted** requirement. A draft or withdrawn one cannot be a
goal, for the same reason it cannot be cited by a change.

Once staged, the set is frozen. Changing it needs review and is announced, so a
release's scope cannot quietly drift after the promise has been made.

## The gate

Executing a release refuses unless **every** locked goal is satisfied, and a
goal counts as satisfied only when both of these hold:

1. A merged pull request cites its identifier in a `Spec:` trailer.
2. The implementation status marks it done.

Citation proves somebody did the work and said which requirement it served. The
status file proves a human agrees it is complete. Requiring both is deliberate:
a citation without a tick is work still in flight, and a tick without a citation
is an unauditable claim.

A refusal names the unmet goals rather than failing blankly. Before tagging, the
same step verifies that the streams still agree with each other and records the
exact submodule pins in the manifest, so the release is reproducible from that
file alone.

## Four lanes, by ceremony

| Lane             | When                                           | Goal gate                                                      |
| ---------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| **Staged train** | A planned minor                                | Full, with a staging period and tracked progress               |
| **Fast lane**    | Spec and sub-repos are already in sync         | Full, run once — only the staging period is skipped            |
| **Hotfix**       | An urgent patch to an already-released version | Bypassed, replaced by a cited fix and maintainer authorisation |
| **Raw tag**      | The primitive underneath all of them           | None                                                           |

Even the fast lane runs the gate. A one-shot release still has to prove its
claimed goals shipped.

## What a version number means

A version says how much changed, so the numbers describe the product rather than
the order in which the work happened to be written. Three rules keep them
honest.

**A major carries the capability that justifies it.** `1.0.0` opens the
dashboard on a bare invocation, and is where everything specified is built and
the interfaces stop moving. A major that adds no capability is a number nobody
can read.

**The train is one sequence, and it ends at `1.0.0`.** There was once a second
epoch — the ecosystem, numbered `2.x`, opening after a `1.0.0` that closed the
first — and the versions that carried it are themed minors on the same train
now, ahead of the major rather than behind it. There is one order to read and
one place it arrives at.

**A version is one theme, not a backlog.** Versions once ranged from nine goals
to a hundred and eighty-five. The large ones were not releases; they were
everything left over with a number attached. Each unreleased version is now
something you can say in a sentence.

## No version ships a stub

A version proves its goals one requirement at a time, and that is not the whole
of what it claims. A requirement can be met while the feature around it is half
built: a `1.0.0` announcing a dashboard whose panels are stubs would satisfy
every goal it locked and still be the release nobody wanted. **The feature is
the unit a reader understands, so the feature is what the gate asks about.**

Executing a release refuses while any feature the manifest locks — one whose
requirements its `goals` name — is not `shipped` in the feature catalogue, and
the refusal names them. That is the whole of what "a major ships no stubs"
means: a rule about every version, of which a major is only where it bites
hardest.

### How far a feature is built

The catalogue answers that in its own field, `maturity`, kept apart from the
`status` that describes the specification. A feature is routinely accepted and
unbuilt for a year, and one field cannot hold both answers without losing
whichever is asked less often.

| Maturity    | What it says                                              |
| ----------- | --------------------------------------------------------- |
| `planned`   | Specified, and nobody has built it                        |
| `building`  | Work has started, or a version in flight locks it         |
| `built`     | Finished and verified, waiting on a version to carry it   |
| `shipped`   | Built and out, in the version the feature names beside it |
| `withdrawn` | No longer to be built                                     |

A shipped feature names the version that carried it, so the gate reads a mark
written before the tag rather than one inferred from it.

`built` sits between `building` and `shipped` because the two on either side
cannot describe a finished feature waiting for a release. A feature whose work
is complete and verified is no longer `building`, and it is not `shipped` either
— nothing has carried it yet, and the field that names the version would be
empty. Without a state for that moment, a bar demanding every locked feature be
`shipped` before a release can be cut is one no release can ever clear: the mark
it asks for is written by the release it is blocking.

So `built` is what a feature claims when the work is done and the tag is not.
The release turns it into `shipped` and writes the version beside it.

## Hotfixes and the trunk

A version is released from the trunk: the tag names a commit on `main`, and
staging cuts no branches. The single carve-out is a hotfix to an
already-released version, where the trunk has moved on and the fix has to reach
the shipped tag. That branch is cut from the version's tag, carries only the
fix, and is deleted once the fix is merged back.

Patches appear in the changelog but never enter the goal-locked train.

## Related

- [Release staging](/spec/70-operations/staging/) — the normative version of this page
- [Releasing](/spec/70-operations/releasing/) — the tag-triggered mechanics underneath it
- [The roadmap](/spec/00-overview/roadmap/) — the milestones each version serves
- [What is built](/project/whats-built/) — the per-deliverable status the gate reads
- [Two version numbers](/api/two-version-numbers/) — what the API's own versioning promises
