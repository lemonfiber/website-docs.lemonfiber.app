---
title: Updating
topic: use
description: Move the stack forward on purpose rather than by accident, and understand the one step you cannot undo.
sidebar: { order: 8 }
---

Nothing in your stack changes because time passed. Every service image is pinned
to an explicit version in the stack manifest, so an update happens when you decide
it should.

That is deliberate. The alternative — floating tags everywhere — means an
unrelated pull can jump six months across a dozen services at once, with no way
back.

Staying on your current versions indefinitely is a perfectly good posture, and
lemonfiber will not nag you about it.

## Knowing what you have

```sh
$ lemonfiber version
```

That reports the version of the binary and the version of the stack it carries.
Both matter, because a lemonfiber release pins a particular stack, and that stack
pins a particular set of image tags.

## The one step you cannot undo

Read this before updating anything.

The automation services migrate their SQLite schema on first start of a new
version, and **there is no downgrade path**. If you pull a newer image and find
it unusable, you cannot simply revert: the database has already been rewritten in
a format the previous version refuses to open.

The way back from that is a restore, not a rollback, which is why the guided
update below takes a backup before it moves anything.

## Updating the stack

```sh
$ lemonfiber update stack
```

A bare run changes nothing. It says which services would move, from which
version to which, how large each step is, and which of them migrate state and so
cannot be walked back. To take the steps:

```sh
$ lemonfiber update stack --confirm
```

A backup is taken first, while nothing can be writing to a database. The
services then move one at a time, in the order the manifest declares them, and
each is proven to answer before the next is touched. A failure stops the run
where it is, so one service that would not come back is diagnosable rather than
twelve at once. `--service` moves one service instead of every one with an
update, and `--wait` lets anything still downloading finish before the services
stop.

The versions it moves to are the ones this build of lemonfiber pins. A newer
stack arrives with a newer lemonfiber, not on its own.

## By hand

`pull` fetches the images for the named forms and applies nothing:

```sh
$ lemonfiber pull tv
```

Your running containers keep using the images they started with, so this is
safe at any time. Bringing the form up again is what puts the new images into
use, recreating the containers whose image changed:

```sh
$ lemonfiber up tv
```

Done this way, the backup is yours to take first:

```sh
$ lemonfiber down
$ lemonfiber backup
```

Then watch the services come back healthy before you walk away.
`lemonfiber ps` is the honest answer about whether they did.

## Updating lemonfiber itself

Updating the binary does not stop, restart or alter your stack. lemonfiber is a
control surface; the containers run independently of it, and you can update the
tool without touching a working system.

```sh
$ lemonfiber update self
```

That replaces nothing. It works out how this copy got onto the machine —
Homebrew, Scoop, winget, cargo, the shell installer, or by hand — and prints the
exact command for whichever tool owns it, because a binary that overwrote itself
underneath a package manager leaves that manager holding a record of something
that is no longer there. `--to <VERSION>` asks about one particular version
instead of the newest, which is how going back is asked for, along with whether
that version reads the configuration already on this machine.

From source, pull and build again:

```sh
$ git pull --recurse-submodules
$ cargo build --release --workspace
```

A newer lemonfiber carries a newer pinned stack, so the version of the stack
`lemonfiber version` reports moves with it. That does not update any running
service by itself: run `lemonfiber update stack` when you want the services to
follow. Downgrading lemonfiber is fine: unlike the service databases, it holds
no state that migrates irreversibly.

See [Install lemonfiber](/start/install/) for every install route.

## A stack of your own

lemonfiber reads a stack as a root and a file per service: `stack.toml` keeps
the versions, the profiles and the forms, and lists in `include` one
`services/<id>.toml` for each service, each holding that service's one
`[[service]]` entry.

```toml
include = [
  "services/sonarr.toml",
  "services/radarr.toml",
]
```

A stack directory you run with `--stack-dir` that keeps its `[[service]]`
entries in `stack.toml` itself is refused as
[`STACK-10`](/fixing/codes/stack/#stack-10), and nothing in it is started. To
move it, put each `[[service]]` entry in a file of its own under `services/`,
named after the service's `id`, and list every file in `include`. Every fault in
the layout is reported in one pass, each naming its file. The stack lemonfiber
ships is already laid out this way, so a stack you never copied needs nothing.

## Your own edits survive

If you have hand-edited the materialised stack files or changed a setting
directly in a service, lemonfiber notices. Those changes are reported as drift
rather than being silently reverted, and an update shows you a difference rather
than overwriting your work.

```sh
$ lemonfiber doctor
$ lemonfiber adopt
$ lemonfiber reset --confirm
```

`adopt` promotes your hand edits to lemonfiber's expected state, so they are kept
across future seeds and restores. `reset` does the opposite — it discards them and
restores lemonfiber's own files, naming exactly what will be lost and doing
nothing until `--confirm`. Both are covered in [Adopt and
reset](/advanced/adopt-and-reset/).

[E1 Stack updates](https://lemonfiber.app/spec/10-functional/features/e-maintenance/e1-stack-updates/)
and [E2 Self-update](https://lemonfiber.app/spec/10-functional/features/e-maintenance/e2-self-update/)
are the requirement sets, and
[J7 Upgrading](https://lemonfiber.app/spec/10-functional/journeys/j7-upgrading/) is
the journey they describe.

## Related

- [Backup and restore](/running/backup-and-restore/) — the safety net this page keeps pointing at
- [Starting and stopping](/running/starting-and-stopping/) — `ps`, `logs` and what healthy means
- [The stack manifest contract](https://lemonfiber.app/spec/20-architecture/contracts/stack-manifest/#service) — where the pinned versions live
