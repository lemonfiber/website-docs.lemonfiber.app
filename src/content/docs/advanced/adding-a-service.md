---
title: Adding a service
description: Three data edits and no code — a compose fragment, a manifest entry, and the forms that should carry it.
sidebar:
  order: 2
---

Adding a service to the stack requires no lemonfiber change and no lemonfiber
release. It is three data edits, and then the checks.

1. A service block in the compose fragment for its profile.
2. A `[[service]]` entry in `stack.toml`.
3. Its profile added to whichever forms should carry it.

Then `just ci` in the stack directory. If you are working on your own stack
rather than the bundled one, point lemonfiber at it with
[`--stack-dir`](/commands/global-flags/).

## Where the compose block goes

`compose.yml` stitches the fragments together and declares no services of its
own. `compose/` holds one fragment per profile — `tv.yml`, `media.yml`,
`torrent.yml` and the rest — and `compose/_common.yml` holds the shared defaults
that fragments reach through `extends:`.

A service block looks like this, which is the real Sonarr entry:

```yaml
services:
  sonarr:
    extends:
      file: compose/_common.yml
      service: rootless
    image: lscr.io/linuxserver/sonarr:4.0.15
    profiles: [tv]
    ports: ["127.0.0.1:8989:8989"]
    volumes:
      - ${DATA_ROOT:-./data}:/data
      - ./config/sonarr:/config
```

Three things in it are not decoration. `profiles:` is what makes the service part
of a profile, and it must match the profile you declare in the manifest. The
published port is bound to `127.0.0.1` for an administrative service, and to the
LAN bind only for a service the household is meant to reach. And the data mount
is the one rule below.

## The one rule

**Every service that touches the library gets exactly one `${DATA_ROOT}:/data`
mount.** Downloads and media live as subdirectories beneath it, on one
filesystem, so an import hardlinks instead of copying. Splitting them into
separate mounts silently turns every import into a copy — it still works, and it
costs the size of every file twice. CI rejects it rather than letting you find
out later. What that looks like from the operator's side is
[hardlinks and one mount point](/fixing/hardlinks-and-one-mount-point/).

## The manifest entry

The `[[service]]` block is where lemonfiber learns what the service is. Every
required field is listed in [the stack manifest](/advanced/the-stack-manifest/);
the ones people forget are `describes` and `without_it`, which are what let a
failure be judged rather than merely reported, and `last_release`, which is the
latest release upstream has published rather than the one you pinned.

`id` must match the Compose service name exactly, `profile` must be exactly one
declared profile, and `tag` must be explicit — a floating tag fails validation,
because nothing in this stack should change because time passed.

## What the checks enforce

Each of these has a specification requirement behind it, and each is itself
proven to fail when broken.

| Check                                      | What it holds to                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| Manifest and compose parity                | Every service in one is in the other                                     |
| One `${DATA_ROOT}:/data` mount per service | Imports hardlink                                                         |
| Bindings match the manifest tier           | Administrative on loopback, household on the LAN                         |
| No `depends_on` across a profile           | Any subset of the stack still boots                                      |
| Killswitch routing                         | Nothing shares the VPN container's profile without its network namespace |
| Pinned, non-floating tags                  | Nothing changes because time passed                                      |
| Capabilities match the manifest            | Only the VPN container holds an elevated network capability              |
| An OSI licence per service                 | Verified against a vendored SPDX list                                    |
| Every form resolves                        | And drags in nothing outside its profiles                                |
| Both architectures per pin                 | `linux/amd64` and `linux/arm64`, read from each registry                 |

The parity checks read the model `docker compose config` resolves rather than the
YAML, so they check what Docker will actually run rather than what the file
appears to say.

## Whether it belongs in the bundled stack

Your own stack is yours. For the bundled one, a service enters only if it is open
source under an OSI-approved licence, publishes native `linux/arm64` and
`linux/amd64` images, is actively maintained, does something no included service
already does, and works without a paid tier.

Maintenance status is established from a project's commit and release history,
never from its own description of itself. A fork advertising itself as an
actively maintained successor, with no releases and no published image, is a dead
fork — and a dead fork is worse than a slow-moving project that works.

Stating the criteria is what makes "why is X not included?" answerable, and makes
an addition a judgement against a standard rather than a matter of taste.

## What lemonfiber does with a service it does not know

It keeps working, generically. Lifecycle and status operations run on a service
lemonfiber has never heard of, and it is shown with an unknown description rather
than hidden. Features that need specific knowledge — wiring it to the other
services, reading its queue health — report as unsupported **for that service**
rather than failing the whole command.

The same applies in reverse. Remove a service lemonfiber depends on and it
reports which features become unavailable; it does not refuse to run.

## Where to go next

[The stack manifest](/advanced/the-stack-manifest/) is the field-by-field
reference. [Running without lemonfiber](/advanced/without-lemonfiber/) is the
compose project on its own, and
[the media-stack repository](/develop/repos/media-stack/) is where these files
live. The specification for this is
[F3 stack manifests](/spec/10-functional/features/f-extensibility/f3-stack-manifests/).
