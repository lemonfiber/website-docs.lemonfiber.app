---
title: Backup and restore
description: Make your configuration recoverable so it stops being precious — what gets captured, what does not, and how to put it back.
sidebar: { order: 7 }
---

The point of a backup here is not the media. Your library may be terabytes and
much of it irreplaceable, but it is not what breaks. What breaks is the small,
intricate, hard-to-recreate state inside the service databases — the indexers you
wired up, the quality profiles, the root folders, the things each service has
learned.

Somebody who cannot recover from a mistake will not experiment, will not update,
and will not touch a working system. That is how stacks end up running years-old
versions. A backup is what makes the configuration ordinary rather than precious.

## Taking one

```sh
$ lemonfiber down
$ lemonfiber backup
```

The stop is not optional, and lemonfiber will refuse to run otherwise. Every
automation service uses SQLite, and copying a SQLite database while it is being
written produces a file that may restore into a subtly corrupt state — which is
worse than no backup at all, because the failure surfaces at restore time, when
you need it most.

It fails closed, too: an engine that will not answer cannot prove nothing is
writing, so an uncertain answer is refused as firmly as a running one.

To capture one service rather than the whole stack:

```sh
$ lemonfiber backup --service sonarr
```

## What is in the archive

| Included                                                         | Excluded              |
| ---------------------------------------------------------------- | --------------------- |
| Each service's configuration and database                        | The media library     |
| lemonfiber's own configuration and its expected-state baseline   | Downloads in progress |
| The materialised stack files, including your local modifications | Container images      |

The exclusions are structural rather than a filter that could be forgotten: the
library, the downloads and the images live outside the layout a backup reads.

### The archive is as sensitive as the credentials in it

A configuration backup holds your VPN key, your provider password and every
service API key. It is marked sensitive at creation and within the archive
itself, because it is easy to forget and copy one to cloud storage without a
thought. Treat it exactly as you would treat the credentials inside it.

## Putting one back

```sh
$ lemonfiber down
$ lemonfiber restore path/to/archive.tar.gz
```

Restore verifies before it replaces. The archive is validated, its version
compatibility checked, and its contents listed before anything is overwritten. A
restore that fails halfway is far worse than one that refuses to start, so:

- An archive written by a newer lemonfiber is refused, with the version gap named
- A corrupt archive, or one whose contents would escape the directory they unpack
  into, is refused before a single file is opened
- A single-service restore replaces only that service and never touches the others

### Restoring onto a different machine

If the archive was taken against a different data root than this machine uses,
the restore is refused until you accept moving it:

```sh
$ lemonfiber restore archive.tar.gz --repoint
```

That re-points the restored configuration at this machine's data root, so the
paths name somewhere that exists here rather than somewhere that does not.

## After a restore

Two things need reconciling, and both are ordinary commands:

```sh
$ lemonfiber up
$ lemonfiber seed
$ lemonfiber doctor --only credentials
```

`seed` re-establishes the wiring between services, which a restore of individual
service databases can leave inconsistent. The doctor's credential category
re-validates the restored credentials against the live services and tells you
which of them no longer work — a backup faithfully restores an API key that was
rotated last month, and it is better to find that out here.

## Retention

A bounded number of backups is kept and the oldest are pruned, because backups
that silently fill the disk they were protecting are not much use. The last
remaining backup is never pruned, whatever the retention setting says.

## What is not automatic yet

The specification asks for a backup to be taken automatically before any risky
operation — an update, adopting an existing setup, removing your configuration.
That is not built yet, so take one yourself before you do anything you would
want to undo. See [E3 Backup and
restore](/spec/10-functional/features/e-maintenance/e3-backup-restore/) for the
full requirement set.

Media is out of scope and will stay out of scope. Use a general-purpose backup
tool for the library; pretending to solve that here badly would be worse than not
solving it.

## Related

- [Updating](/running/updating/) — the operation a backup most obviously precedes
- [Adopt and reset](/advanced/adopt-and-reset/) — the other way to get back to a known state
- [The support bundle](/fixing/the-support-bundle/) — a different archive, for a different purpose
