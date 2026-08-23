---
title: What lemonfiber is
description: One binary that sets up a media stack, runs it in slices, and proves it is working.
sidebar: { order: 1 }
---

lemonfiber runs a media stack for you: the indexers, the download clients, the
automation services and the library interfaces that sit between a request and a
finished episode on a shelf.

It is one binary. You answer a few questions, and it writes the configuration,
starts the services you asked for, wires them to each other through their own
APIs, and keeps checking that what it built still matches what you asked for.

## The problem it is solving

Self-hosted media automation works well once it is running. Getting there is the
problem, and it has three faces.

**Setup is an afternoon of undocumented tribal knowledge.** The usual path is to
find a compose file somewhere, paste it, fix the paths, discover your imports are
copying rather than hardlinking, read a quality guide, redo the paths, generate
API keys by hand, wire six services together through six different settings
screens, and then never touch it again out of fear.

**It is all or nothing.** Most stacks are a single compose file with a dozen
services. Wanting to look one thing up means booting a media server, a request
portal, a subtitle daemon and four automation services.

**Failures are silent.** A VPN container that fails open still shows as running.
Imports that quietly degrade from hardlinking to copying still work — they just
consume twice the disk and break seeding. A stack that reports green while doing
the wrong thing is worse than one that crashes.

## The three commitments

| Commitment                | What it means in practice                                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No proprietary components | Every bundled service is open-source and self-hosted. Nothing phones home, nothing has a paid tier.                                                                                                                                       |
| Runs in slices            | Named [forms](/running/forms-and-slices/) start part of the stack. `search` is three containers; `full` is eighteen. Same configuration, same data, no separate install.                                                                  |
| Correct by construction   | Setup creates a hardlink and inspects it rather than assuming one works. [The doctor](/fixing/run-the-doctor/) compares public IP addresses to prove the VPN is isolating traffic. Administrative interfaces bind to loopback by default. |

The third one is the difference that matters most day to day. Where a claim is
checkable, lemonfiber checks it: an assumption stated in a README is
documentation, and an assertion in `lemonfiber doctor` is engineering.

## Who it is for

Someone technical enough to run Docker, but not interested in becoming an expert
in six web interfaces — plus everyone else in the house, who will only ever see
the request portal and the media server, and the contributor who wants to add a
service without touching Rust.

Where those needs conflict, ease of first setup wins. That is why the setup
wizard is a headline feature rather than a convenience, and why every interactive
action also has a flag-driven equivalent, so serving the newcomer never costs the
person writing a script.

## What it is not

It is not a media server. Jellyfin plays your library; lemonfiber runs Jellyfin.
It is not a downloader either — SABnzbd and qBittorrent fetch the bytes.
lemonfiber is the layer that installs those things, connects them, and tells you
the truth about what they are doing.

It does not create your third-party accounts, and it will not recommend a
particular Usenet provider, indexer or VPN. It explains what each one is, what it
costs roughly, and which selection criteria actually matter — then validates the
credentials you supply against the live service before storing them.

It also does not take your household anywhere near a terminal. They sign in to
the request portal with the same account they watch with, and never encounter
lemonfiber at all.

## What this site covers

How to [install](/start/install/) lemonfiber, how to
[run a stack](/running/), what to do when
[something is wrong](/fixing/), the
[full command reference](/commands/every-command/), and how to
[build on it](/develop/).

It is not the specification. The requirements lemonfiber is written against —
every feature, every journey, every architectural decision — live in
[the specification](/spec/), mirrored on this site. Where a rule is normative,
these pages link to the page that owns it rather than restating it. The
[project vision](/spec/00-overview/vision/) is the best single page to read next
if you want the reasoning rather than the instructions.

lemonfiber is source-available under the Hippocratic Licence 3.0, which is
deliberately not an OSI-approved licence. The bundled services keep their own
licences, all of them open source.
