---
title: Adopt and reset
topic: use
description: Your edits survive by default. How lemonfiber tells an edit from a stale default, how to make one permanent, and how to throw them all away.
sidebar:
  order: 3
---

Two promises pull against each other. Configuration should be reproducible:
delete it, run [`seed`](/commands/), and get a working stack back. And you should
be able to change anything.

They fight because seeding is idempotent — it re-asserts lemonfiber's view of
configuration. An operator who spends an evening tuning quality profiles and then
runs seed for an unrelated reason would silently lose that evening. That is a
trust-destroying outcome arising from two features that are each individually
correct, so it is resolved rather than left to luck.

## lemonfiber records what it wrote

Every value lemonfiber writes into a service is recorded: the field, the value,
and when. That record is what makes an edit detectable at all. Without it,
lemonfiber cannot tell a value you changed from one it set itself.

## Three values, not two

Comparison is three-way, like a merge.

| Source   | Meaning                          |
| -------- | -------------------------------- |
| Expected | What lemonfiber last wrote       |
| Actual   | What the service currently holds |
| Desired  | What lemonfiber would write now  |

Two values can only say _different_. Three can say which of the two changed,
which is the whole difference between preserving an edit and reverting one.

A seed reports each value it looked at in one of these states.

| State           | What seed did about it                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `wired`         | It was absent, or not what lemonfiber would have it be: written, and read back                       |
| `already-wired` | Already what lemonfiber would write. Nothing, which is what makes a second run change nothing        |
| `drifted`       | You changed it while lemonfiber's intent stayed put. Your value is preserved, and the drift reported |
| `stale`         | Still lemonfiber's own value, but its intent has moved on. Reported; nobody's edit is at stake       |
| `conflicted`    | Both the value and lemonfiber's intent moved away from the baseline. Presented, and left alone       |
| `adopted`       | A value of yours taken as the accepted state. Kept, changing nothing                                 |
| `unmanaged`     | A value lemonfiber never wrote and has no record for. Taken as the baseline, not overwritten         |
| `observed`      | An area you declared unmanaged. Nothing read from the service, nothing written to it                 |
| `unmatched`     | Something fills what a service asks for, and nothing lemonfiber does connects the two                |
| `would-wire`    | What a rehearsal would have written. Nothing was                                                     |
| `would-adopt`   | What a rehearsal would have taken on as yours. Nothing was                                           |
| `skipped`       | Something it needs was not answering. A later run completes it                                       |
| `failed`        | Attempted, and the service rejected it, in its own words                                             |
| `refused`       | Refused by lemonfiber's own policy, for a reason a re-run will not resolve                           |

The `unmanaged` row is why a first run against a stack you already had does not
report mass drift: there was never an expectation to drift from.

Drift itself is information, not a failure. It escalates to a warning only when
it breaks something — a root folder edited to a path that does not exist, say.
Drift in a value that holds a secret is reported without either value being
shown.

## `lemonfiber adopt`

Promotes your current edits to lemonfiber's expected state. It wires what is
missing exactly as a seed does, and promotes every drifted value to yours. Once
adopted, a value stops reporting as drift and is kept across future seeds and
restores.

An adopted value stays yours even once lemonfiber's own intent later moves on. It
is only taken as a fresh edit if you move it again.

This is how customisation becomes durable rather than perpetually flagged. Run it
with [`--dry-run`](/commands/global-flags/) first if you want to see what it would
take on.

## `lemonfiber reset`

The opposite, and the escape hatch from "your edits win". It discards your
hand-edits and restores lemonfiber's own state.

Because it throws work away, it does nothing until you confirm it. Run it once to
see what would be lost, then again with `--confirm` to carry it out.

| What it reverts                                | Detail                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Hand-edits to the stack files lemonfiber wrote | Each with the diff of the lines that differ — yours marked `-`, lemonfiber's `+` |
| Service connections whose value drifted        | Each named the way a seed report names it                                        |

It restores lemonfiber's state **including** your recorded quality preset — that
is a managed setting rather than drift, so the stack is written carrying the
preset you chose, with only the hand-edits on top of it reverted.

## Files on disk are covered too

The same logic applies to the compose file and stack configuration lemonfiber
writes out. Local modifications are detected by content rather than by timestamp,
and are never silently overwritten on an upgrade: you are shown a diff and you
choose. Nothing is auto-merged.

## Declaring an area unmanaged

To keep a part of the stack by hand for good, write it down in the
`LEMONFIBER_UNMANAGED` setting: pairs of `area=reason`, comma-separated.

```sh
$ lemonfiber config set LEMONFIBER_UNMANAGED "config/recyclarr=my own profiles live in here,sonarr=I tune this one by hand"
```

A name covers the thing it spells and anything beneath it after a slash:
`sonarr` covers the service, and `config` covers `config/recyclarr/recyclarr.yml`.
A stack file beneath a declared name is never written, a declared service is not
seeded and reports as `observed`, and a declared setting is refused by
`config set`, with your reason. A repair you confirm with `doctor --fix` is not
stopped by it: that is a decision you have just taken, one at a time and by name.
The reason has only to be there; an entry with no `=` declares nothing. The
requirement is
[F1 customisation](https://lemonfiber.app/spec/10-functional/features/f-extensibility/f1-customisation/).

## Where to go next

The normative account of all of this is
[C9 drift detection](https://lemonfiber.app/spec/10-functional/features/c-trust/c9-drift/), and what
seed is actually wiring is
[D1 service auto-wiring](https://lemonfiber.app/spec/10-functional/features/d-content/d1-seed/). If you
are restoring rather than resetting,
[backup and restore](/running/backup-and-restore/) is the other direction.
