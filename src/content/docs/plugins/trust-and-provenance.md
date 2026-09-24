---
title: Trust and provenance
description: How lemonfiber pins what a plugin runs, what it can tell you about who published it, where every value came from, and what a plugin may never do.
sidebar:
  order: 6
---

Installing a plugin is running somebody else's service on your machine. What
lemonfiber can promise is not that the service is good, but that what runs and
what it may reach are stated in advance, checkable without running it, and
traceable afterwards.

## What runs is a digest

A plugin names its image by digest — `sha256:` and sixty-four hex characters —
and the tag beside it is for people to read and is never resolved. The image
that runs is the image that was declared, byte for byte, whatever the tag has
since been moved to. The decision is
[ADR-0023](/spec/00-overview/decisions/0023-a-pin-is-a-digest/).

## Who published it

```sh
lemonfiber plugin provenance ./my-plugin --key publisher.pem
```

This asks the registry each image is pinned in whether it offers a signature for
that exact digest. It is the only plugin read that reaches the network, and it
answers one of three:

- **signed** — a signature verifies against a key you named with `--key`;
- **unproven** — nobody signed it, or you named no key to check against. A
  publisher who signed nothing has made no claim, which is a different fact from
  a claim that failed;
- **refused** — a signature is there and does not hold. Only this exits
  non-zero.

At the revision this site pins, the keys are only the ones you name: there is
no trust root, transparency log or catalogue policy yet, and `plugin install`
does not ask this question for you. Run it yourself before installing.

## Reviewed or not

`lemonfiber plugin installed` says of each plugin whether anybody reviewed it.
Today the answer is always no. _Reviewed_ is meant to mean installed from the
[catalogue](/plugins/the-catalogue/) at a commit a person reviewed, and the
reviewed catalogue is not built yet, so every install — from a path you named —
is recorded as unreviewed and shown as such.

## Where every value came from

Every value in force carries its origin: **bundled** (lemonfiber's own),
**operator** (you set it), **plugin** (and which one), or **unknown** (with the
reason it could not be established). The origin shows on the surfaces you
already read rather than on a separate plugin screen — `lemonfiber config`,
`lemonfiber credentials` for every secret a plugin holds, `lemonfiber outbound`
for every host a plugin may reach, and the doctor's findings. The same
`origin` field is in the machine-readable payloads; see
[every payload kind](/api/kinds/).

Every plugin install, update and removal goes through the journal under the
plugin's name, so it is in `lemonfiber history` beside every other change.

## What a plugin may never do

No plugin contributes code to lemonfiber's own process — not in a sandbox, not
behind an opt-in. That is a requirement of
[F3](/spec/10-functional/features/f-extensibility/f3-stack-manifests/), enforced
by a dependency check in the build, and
[F11](/spec/10-functional/features/f-extensibility/f11-executing-contributed-code/)
exists only to hold the question open: nothing may be built against it, and
changing the answer takes a new architecture decision.

A plugin also cannot widen its own container: there is no field for
environment, devices, kernel capabilities, privilege or network mode.

## What is planned

Recipes — ordered calls that configure what a plugin installed — are specified
in [F8](/spec/10-functional/features/f-extensibility/f8-recipes/) and refused by
this build. When they arrive, every value a recipe would carry to a host outside
the machine is declared as its own pair and agreed to on its own, at rehearsal,
and a destination is a name that is refused if it resolves inward. The reviewed,
signed catalogue is
[F5](/spec/10-functional/features/f-extensibility/f5-plugin-catalogue/).
