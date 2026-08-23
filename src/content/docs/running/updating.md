---
title: Updating
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

The way back from that is a restore, not a rollback. So:

```sh
$ lemonfiber down
$ lemonfiber backup
```

Take the backup first, every time. See [Backup and
restore](/running/backup-and-restore/).

## Fetching newer images

```sh
$ lemonfiber pull tv
```

`pull` fetches the images for the named forms and applies nothing. Your running
containers keep using the images they started with, so this is safe to do at any
time — including over a slow connection, hours before you intend to act on it.

Bringing the form up again is what puts the new images into use, recreating the
containers whose image changed:

```sh
$ lemonfiber up tv
```

Do that with a fresh backup in hand, and watch the services come back healthy
before you walk away. `lemonfiber ps` is the honest answer about whether they
did.

## Updating lemonfiber itself

Updating the binary does not stop, restart or alter your stack. lemonfiber is a
control surface; the containers run independently of it, and you can update the
tool without touching a working system.

How to update depends on how you installed. Since building from source is the
route that works today, updating means pulling the repository and building again:

```sh
$ git pull --recurse-submodules
$ cargo build --release --workspace
```

A newer lemonfiber carries a newer pinned stack, so the version of the stack
`lemonfiber version` reports will move with it. That does not update any running
service by itself — the images are still the ones your containers were started
with until you pull and bring the form up again.

See [Install lemonfiber](/start/install/) for the state of the other install
channels, and [E2 Self-update](/spec/10-functional/features/e-maintenance/e2-self-update/)
for how updating is specified to work once those channels exist. Downgrading
lemonfiber is fine: unlike the service databases, it holds no state that migrates
irreversibly.

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

## What the specification asks for that is not built yet

Stack updates are specified in much more detail than lemonfiber currently
implements. The intended behaviour is a single guided operation: show what is
available and the size of each jump, state which updates will migrate a database
before proceeding, take a backup automatically and refuse to continue if it
fails, then update service by service with health verified between each so that a
failure halts rather than continuing into a half-migrated stack.

None of that is in place yet. Until it is, the sequence above — back up, pull,
bring up, check — is the manual version of the same discipline, and the reason
this page spends more words on the backup than on the update.

[E1 Stack updates](/spec/10-functional/features/e-maintenance/e1-stack-updates/)
is the requirement set, and [J7
Upgrading](/spec/10-functional/journeys/j7-upgrading/) is the journey it
describes.

## Related

- [Backup and restore](/running/backup-and-restore/) — the safety net this page keeps pointing at
- [Starting and stopping](/running/starting-and-stopping/) — `ps`, `logs` and what healthy means
- [The stack manifest](/advanced/the-stack-manifest/) — where the pinned versions live
