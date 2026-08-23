---
title: Two version numbers
description: The package version and the wire version do different jobs, and conflating them is the mistake to avoid.
sidebar:
  order: 5
---

Anything that speaks lemonfiber's machine-readable output carries two version
numbers, and they are not the same number wearing two hats.

| Number                        | Scheme            | What it describes | What moves it                |
| ----------------------------- | ----------------- | ----------------- | ---------------------------- |
| The package or binary version | Semver            | The software      | Any release of that software |
| `api_version`                 | Monotonic integer | The wire          | A field removed or retyped   |

`api_version` is `1` today. Many package versions may speak one wire version:
fixing a bug in the terminal interface releases a new binary and changes nothing
about the wire, and an SDK can publish a dozen versions while still speaking
version 1.

## Why the wire version is an integer

Semver's minor and patch distinction implies backwards-compatible change, and for
a **parsed format** that distinction is unreliable. A field addition is
compatible only if every consumer ignores unknown fields; a field becoming
optional is compatible only in one direction. An integer states the only thing
that matters: can this parser read this document? Yes or no.

So additive changes leave `api_version` alone, and removing or retyping a field
increments it. That is what makes it worth asserting on: a script can check the
number rather than pattern-matching the shape of the output it got.

## Where the two are checked

| When                            | What happens                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| At build                        | A client's declared `api_version` is validated against the binary at compile time, so a mismatched pair cannot be released             |
| At run time                     | A mismatch is refused plainly, naming both versions, rather than rendering a page or a value whose fields have quietly changed meaning |
| When an SDK generates its types | Generation refuses an artefact whose `api_version` the SDK does not implement, naming both versions, and writes nothing                |

The build-time check exists because the built web client is embedded from a
pinned submodule. The run-time check remains anyway, because a browser may hold a
cached older client. Types that compile and lie are worse than a build that
stops, and a refusal that does not say which two versions disagreed sends
somebody looking for what it already knew.

## The other numbers, and where they live

Two further versions exist, and they belong to the stack rather than to the wire.

| Version          | Scheme            | Owns                          |
| ---------------- | ----------------- | ----------------------------- |
| `stack_version`  | Semver            | The service set and the forms |
| `schema_version` | Monotonic integer | The manifest **format**       |

They are separate because they change for different reasons. Bumping a service's
pinned image tag changes `stack_version` and nothing else. Adding a manifest
field changes `schema_version`. Fixing a bug in the binary changes only the
binary. Both are described in
[the stack manifest](/advanced/the-stack-manifest/), and a stack may also declare
a `min_cli_version` to refuse a binary older than it needs.

`lemonfiber version` reports the binary, the stack, the manifest schema versions
this build can read, and the Compose version it found — or says Compose is not
reachable, rather than leaving a blank.

## What that means for a downgrade

lemonfiber holds no state that migrates irreversibly, so **downgrade is
supported** — unlike the library managers' own databases, where it is not.
Configuration written by a **newer** binary is refused rather than modified.
Silently downgrading a configuration file is how a downgrade-to-test becomes an
unrecoverable state.

For the manifest format, a binary supports the current `schema_version` and
exactly one predecessor. That gives one release cycle of overlap to anyone
maintaining a fork, without carrying parser variants indefinitely; dropping
support is a breaking change and moves the binary's major version.

## Where to go next

The normative account is
[the versioning contract](/spec/20-architecture/contracts/versioning/). The
envelope the wire version belongs to is [the envelope](/api/the-envelope/), and
the manifest the other two belong to is
[the stack manifest](/advanced/the-stack-manifest/). For keeping a running stack
current, see [updating](/running/updating/).
