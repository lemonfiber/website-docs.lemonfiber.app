---
title: The version train
description: How a lemonfiber release comes together — goals locked before the work, and a gate that refuses to ship until every one of them is proven.
sidebar: { order: 1 }
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

| Field          | What it holds                                                       |
| -------------- | ------------------------------------------------------------------- |
| `version`      | The semantic version, matching the tag it will eventually carry     |
| `epoch`        | Which epoch it belongs to — `v1` or `v2`                            |
| `status`       | Where the version is in its lifecycle                               |
| `repos`        | The release streams this version cuts                               |
| `goals`        | The locked list of accepted requirement identifiers it must satisfy |
| `closes_epoch` | Present only on a major, naming the epoch it completes              |
| `pins`         | The exact submodule commits embedded, recorded when it ships        |

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
dashboard on a bare invocation. `2.0.0` runs the stack without Docker, which is
a different generation of the product. A major that adds no capability is a
number nobody can read.

**An epoch's work ships inside its own major.** The ecosystem features were once
scheduled as minors, one of which removed the container runtime — anyone reading
the version would have been misled about how much had changed. They are `2.x`
now, so the epoch boundary and the major boundary agree.

**A version is one theme, not a backlog.** Versions once ranged from nine goals
to a hundred and eighty-five. The large ones were not releases; they were
everything left over with a number attached. Each unreleased version is now
something you can say in a sentence.

## A major ships no stubs

A minor proves its own goals. A **major proves its whole epoch**: a manifest
declaring that it closes an epoch cannot execute unless every feature tracking
that epoch is accepted and marked done — the same dual proof, widened from a
requirement list to the epoch's entire surface.

That is what makes "no major ships with stubs" mechanical rather than
aspirational, and a refusal names the features that are not finished.

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
