---
title: Running without lemonfiber
topic: use
description: The stack is a Compose project lemonfiber writes. Run it with plain Docker — no binary anywhere.
sidebar:
  order: 4
---

This is the load-bearing guarantee, and everything else about customisation is
convenience next to it: **the stack runs with no lemonfiber binary anywhere.**

The project lemonfiber writes is a real Compose project. It names itself, writes
every value it runs with into itself, and keeps beside it a `.env` naming the
profiles of the last start and the files to merge. Run `docker compose up` in its
directory and the stack lemonfiber last started comes up, with no lemonfiber
binary running. That is what makes adopting lemonfiber a reversible decision —
and it is why the suspicion an experienced operator brings to a tool that wraps a
system in an opaque layer is answered here rather than argued with.

## Running it

```console
$ lemonfiber stack
```

[`lemonfiber stack`](/commands/reference/stack/) says which stack this machine runs, the stack
lemonfiber ships or your own, where its Compose project and `.env` are, the exact
`docker compose` words that start it with no lemonfiber running, and anything
those words alone do not start.

Forms are named profile sets and nothing more, so anything lemonfiber can start
you can start by naming the profiles yourself: the `tv` form is
`--profile search --profile usenet --profile torrent --profile tv --profile subs`.

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

[Adding a service](/advanced/adding-a-service/) is a stack of your own from the
editing side, and [the stack manifest](/advanced/the-stack-manifest/) is the file
lemonfiber writes the project from. The requirement behind this page is
[F1 customisation](https://lemonfiber.app/spec/10-functional/features/f-extensibility/f1-customisation/).
