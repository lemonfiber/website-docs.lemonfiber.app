---
title: The stack manifest
topic: use
description: stack.toml is everything lemonfiber knows about the services. Where it lives, how to run a stack of your own, and what to do when lemonfiber refuses one.
sidebar:
  order: 1
---

`stack.toml` sits at the root of a stack directory, beside `compose.yml`, and
each service is described in a file of its own under `services/`, which the
root's `include` list names. Everything lemonfiber knows about the stack comes
from these files: the services, the role each plays, the forms you start them
by, and how they are wired to each other. It knows nothing about Sonarr that the
manifest does not declare, so adding a service is a new file and an `include`
entry, and not a new release.

Every field, what it means and the rule each one is held to are in
[the stack manifest contract](https://lemonfiber.app/spec/20-architecture/contracts/stack-manifest/).
This page covers what you do with the file.

## The stack lemonfiber ships, and one of your own

The stack lemonfiber ships is built into the binary. The build refuses to
produce a binary whose built-in manifest it cannot read, so that stack is
checked before it ever reaches you.

To run a stack of your own, point lemonfiber at its directory:

```sh
$ lemonfiber --stack-dir <PATH> ps
```

`--stack-dir` is a [global flag](/commands/global-flags/), so it goes with any
command. A directory of your own is checked when lemonfiber loads it. To add a service to it, see
[adding a service](/advanced/adding-a-service/).

## The three versions it carries

```toml
schema_version  = 1
stack_version   = "0.1.0"
min_cli_version = "0.1.0"
```

- `schema_version` is the generation of the file's **format**.
- `stack_version` is the version of what the file **describes**. It moves when
  services or forms change.
- `min_cli_version` is the oldest lemonfiber that may operate the stack.

A `schema_version` this lemonfiber does not read and a `min_cli_version` newer
than it are refused with different codes, so the message says which one is
wrong.

## When lemonfiber refuses a stack

lemonfiber checks the whole manifest before it starts anything. It reports
**every** fault it finds in one pass, and each one names where it is. The
refusal is a [`STACK` code](/fixing/codes/stack/):

| What you see | What to do                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STACK-1`    | No readable `stack.toml` is where a stack was expected. Point `--stack-dir` at the directory that holds it.                                                      |
| `STACK-7`    | The file is not valid TOML. Fix it at the line the message names.                                                                                                |
| `STACK-2`    | The `schema_version` is one this lemonfiber does not read. Update lemonfiber, or use a stack written for this version.                                           |
| `STACK-9`    | The `min_cli_version` is newer than the lemonfiber running. Run `lemonfiber update self`.                                                                        |
| `STACK-8`    | The file names things this lemonfiber has no meaning for, usually because it comes from a newer lemonfiber. Update lemonfiber, or change what the message names. |
| `STACK-6`    | The manifest contradicts itself. Common causes are a floating image tag, an id declared twice, or a form naming a profile nobody declares.                       |

The full list of rules is the contract's
[validation section](https://lemonfiber.app/spec/20-architecture/contracts/stack-manifest/#validation).

## Where to go next

[Adding a service](/advanced/adding-a-service/) is the same file from the
editing side. [Running without lemonfiber](/advanced/without-lemonfiber/) is
the Compose project underneath it. [Forms and slices](/running/forms-and-slices/)
is what the forms are for.
