---
title: Starting and stopping
description: Up, down, switch and restart — what each one will affect before it acts, and why "started" means usable rather than merely running.
sidebar: { order: 3 }
---

This is the part of lemonfiber you will use most, so it is built to be fast,
predictable, and honest about what actually happened.

## Starting

```sh
$ lemonfiber up tv
```

Naming no form starts everything the stack declares. Naming several starts the
union of them.

Starting waits for each service to report **healthy**, not merely for a container
process to exist. The automation services take several seconds to open their
databases and bind their ports; Jellyfin takes considerably longer on first run.
Being told "started" and then getting connection refused is being lied to, so
lemonfiber waits, and shows per-service progress while it does.

A missing image is pulled, with progress, rather than producing an error.

To start only part of a form:

```sh
$ lemonfiber up tv --service sonarr
```

Starting something already running is a no-op that says so. It is not an error,
and it is not a restart.

## Seeing what is actually happening

```sh
$ lemonfiber ps
```

This reports what each service is doing, not whether it is "up" — which is an
ambiguity rather than a status. A service is absent, stopped, starting, healthy,
unhealthy, crash-looping, or failed. A crash loop is reported as a crash loop
rather than as a service that has been starting for ten minutes.

A form is inactive, partial, active, or degraded, which is the rollup of the
services in it.

For live output:

```sh
$ lemonfiber logs sonarr sabnzbd --follow
$ lemonfiber logs --form tv --tail 200
$ lemonfiber logs --watch
```

Reading several services interleaved is the point. An import failure is usually
only explicable with the automation service's lines and the download client's
lines side by side. `--watch` opens a screen you can scroll back through and
filter; see [The TUI](/commands/the-tui/).

## Stopping

```sh
$ lemonfiber down tv
```

Every operation lists what it will affect before it acts. Stopping `hunt` while
`tv` is also running would stop six services, four of which `tv` still needs — so
lemonfiber refuses to stop a service another active form requires, and names that
form.

If downloads are in flight you are told, and offered a choice:

```sh
$ lemonfiber down tv --wait     # let anything downloading finish first
$ lemonfiber down tv --yes      # stop now, without being asked
```

Both SABnzbd and qBittorrent resume afterwards, but that is a decision to take
knowingly rather than one to discover.

The VPN is stopped last wherever a download client depends on its network
namespace. Tearing down Gluetun first would drop qBittorrent's networking out
from under it.

## Changing shape

```sh
$ lemonfiber switch tv movies
```

`switch` makes those forms the active set and stops only what falls outside the
new shape. Shared services keep running rather than being torn down and rebuilt,
so a transfer in progress survives the change.

Use it in preference to a `down` followed by an `up` whenever you are changing
which forms are running rather than stopping altogether.

## Restarting one thing

```sh
$ lemonfiber restart tv sonarr
```

The first argument is the form holding the service; naming no services restarts
the whole form. One wedged service should never require restarting eight.

## Guarding the data location

```sh
$ lemonfiber watch tv
```

This keeps an eye on the data root while the named forms run and stops them if it
disappears — which is what you want on an external disk or a network share.
Services writing into a path that has vanished is how a library gets recreated,
empty, inside a mount point.

## Seeing the command underneath

```sh
$ lemonfiber up tv --dry-run
```

`--dry-run` prints the exact `docker compose` invocation and executes nothing.
It is there for debugging, for learning what lemonfiber is doing on your behalf,
and for the case where you would rather run it yourself — see [Without
lemonfiber](/advanced/without-lemonfiber/).

## When two things happen at once

Lifecycle operations are serialised, not raced. A second operation is told that
one is already running.

If a previous run was killed and never released its claim on the stack, `--force`
takes it back. That flag exists for exactly that situation, and it is worth being
sure no other run is genuinely in progress before you reach for it.

## When it does not come up

A service that never becomes healthy times out within a bounded period and shows
its recent log lines inline, rather than hanging forever or quietly giving up. A
port conflict names the port and, where the operating system allows, the process
holding it. A disk that is full is reported as a disk problem, because the remedy
has nothing to do with containers.

If none of that identifies it, [run the doctor](/fixing/run-the-doctor/), which
checks the environment rather than the symptom.

## Related

- [Forms and slices](/running/forms-and-slices/) — what these operations apply to
- [Stuck downloads](/fixing/stuck-downloads/) — when things are running but nothing moves
- [Global flags](/commands/global-flags/) — `--json`, `--dry-run`, `--stack-dir` and the rest
- [B2 Lifecycle control](/spec/10-functional/features/b-running/b2-lifecycle/) — the requirements behind this page
