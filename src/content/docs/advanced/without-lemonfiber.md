---
title: Running without lemonfiber
description: The stack is a standalone Compose project. Clone it, set the variables, run it with plain Docker — no binary anywhere.
sidebar:
  order: 4
---

This is the load-bearing guarantee, and everything else about customisation is
convenience next to it: **the stack runs with no lemonfiber binary anywhere.**

`lemonfiber-media-stack` is a real Compose project, not a set of files a tool
generates. Clone it, set a few variables, and run `docker compose` yourself. That
is what makes adopting lemonfiber a reversible decision — and it is why the
suspicion an experienced operator brings to a tool that wraps a system in an
opaque layer is answered here rather than argued with.

## Running it

```console
cp .env.example .env      # set DATA_ROOT, and VPN credentials if using torrents
docker compose --profile search --profile usenet --profile torrent \
               --profile tv --profile subs up -d
```

That five-profile set **is** the `tv` form. Forms are named profile sets and
nothing more, so anything lemonfiber can start you can start by naming the
profiles yourself.

The repository's own tasks read the sets out of `stack.toml`, so they cannot
drift from what lemonfiber would start:

```console
just forms-list           # search, dl, hunt, tv, movies, music, books, …
just up tv
just down tv
```

Docker Compose **v2.20 or newer** is required, because `compose.yml` uses
`include:`.

## What is in the repository

| File                  | What it is                                                                    |
| --------------------- | ----------------------------------------------------------------------------- |
| `stack.toml`          | The manifest lemonfiber consumes — services, profiles, forms                  |
| `compose.yml`         | Stitches the fragments together; declares no services of its own              |
| `compose/`            | One fragment per profile — `tv.yml`, `media.yml`, `torrent.yml`, and the rest |
| `compose/_common.yml` | Shared service defaults, reached through `extends:`                           |
| `.env.example`        | Every variable, documented                                                    |
| `stacks/`             | An overlay for NAS and copy mode                                              |
| `config/`             | Seeded templates for Recyclarr, Homepage and Caddy                            |
| `scripts/`            | The checks CI runs, all runnable locally through `just`                       |

The shortest working `.env` is `DATA_ROOT` plus, if you want torrents, a
WireGuard key. Everything with a sensible default already has it.

Two variables are worth reading before you change them. `DATA_ROOT` is the single
data root, and downloads and media both live beneath it on one filesystem so that
imports hardlink instead of copying. `LAN_BIND` decides where the household
services publish; the administrative services are always on `127.0.0.1` and that
is not configurable, because they hold full control of the stack and most ship
with weak or disabled default authentication.

## The escape hatches from the other side

You do not have to leave lemonfiber entirely to stay in control of what it does.

| Flag                 | What it buys                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Prints the exact underlying invocation and changes nothing. Nothing is generated that you cannot read          |
| `--stack-dir <PATH>` | Operates your own stack directory instead of the embedded one. lemonfiber validates only the manifest contract |

And every interactive action has a flag-driven equivalent that runs unattended
and exits with a meaningful status. That is what makes lemonfiber scriptable, and
what stops a friendly interface from becoming a cage.

## What you give up by leaving

Plain Compose runs the services. It does not do the things lemonfiber exists to
do, and it is worth being clear about which those are.

- **The proofs.** That the VPN is actually carrying the torrent traffic, and that
  imports are hardlinking rather than copying, are observations of the running
  result. Compose starting a container is not one of them.
- **The wiring.** Roughly thirty connections between the services — download
  clients registered in each library manager, indexers pushed out, root folders,
  subtitle providers, request targets, dashboard keys. Each is otherwise
  configured by hand, in a different interface, by copying a value from somewhere
  else.
- **Drift protection.** Nothing records what was written, so nothing can tell
  your edit from a stale default. See [adopt and reset](/advanced/adopt-and-reset/).
- **One health answer.** Twelve containers up while traffic leaves outside the
  tunnel is not a healthy stack, and only something computing health from findings
  rather than from container counts will say so.

## Where to go next

[Adding a service](/advanced/adding-a-service/) is the same repository from the
editing side, and [the stack manifest](/advanced/the-stack-manifest/) is the file
that keeps the two halves in step.
[The media-stack repository](/develop/repos/media-stack/) is its own page, and the
requirement behind this one is
[F1 customisation](/spec/10-functional/features/f-extensibility/f1-customisation/).
