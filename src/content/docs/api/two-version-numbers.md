---
title: Two version numbers
topic: build
description: The package version and the wire version do different jobs. Which one to check, and what to do when it is not the one you speak.
sidebar:
  order: 5
---

Anything that reads lemonfiber's machine-readable output deals with two version
numbers, and they are not the same number.

| Number                        | Scheme  | What it describes |
| ----------------------------- | ------- | ----------------- |
| The package or binary version | Semver  | The software      |
| `api_version`                 | Integer | The wire          |

Many package versions speak one wire version. A new lemonfiber or a new SDK
release does not, on its own, change what a payload looks like.

## Check `api_version`, not the package version

Every payload carries `api_version` in [the envelope](/api/the-envelope/). Adding
a field leaves it alone. Removing or retyping a field moves it. So:

- Read `api_version` before anything else in a payload, and refuse one your
  client does not implement. Name both versions when you do, so the person
  reading the error knows which side to update.
- Ignore fields you do not know. A new field is not a new wire version.
- Do not compare package versions to decide whether you can read a payload.
  Two binaries a release apart can speak the same wire, and that is the usual
  case.

A narrower change can land without moving `api_version`, but only as a declared
break, listed field by field in
[the versioning contract](https://lemonfiber.app/spec/20-architecture/contracts/versioning/#the-machine-readable-output-contract).
Read that list when you upgrade.

## The stack's versions are not the wire's

A stack carries version numbers of its own, `schema_version` and
`stack_version`, and they belong to `stack.toml`, not to the wire. They are on
[the stack manifest](/advanced/the-stack-manifest/). `lemonfiber version` reports
the binary, the stack it operates, the manifest schema generations it reads, what the container engine reports
where it can be asked, and what each release changed.

## Where to go next

The normative account, with every rule both numbers are held to, is
[the versioning contract](https://lemonfiber.app/spec/20-architecture/contracts/versioning/).
For keeping a running stack current, see [updating](/running/updating/).
