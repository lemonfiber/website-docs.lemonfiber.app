---
title: Installing a plugin
topic: build
description: Ask for an install's offer, take it, and take the plugin back off — and what each step checks before it counts as done.
sidebar:
  order: 1
---

A plugin is installed from its source: the directory holding its `plugin.toml`,
the file itself, or a git repository at the branch, tag or commit named after its
last `@`. A git source is resolved to one commit before anything is fetched, and
that commit is fetched as data: nothing of it is run, it is removed once the
install is done, and the record keeps the repository and the commit. A bare word
such as `komga` is a name for the [catalogue](/plugins/the-catalogue/) to
resolve, so a directory of that name is written `./komga`. Every flag each word
takes is in [the command reference](/commands/reference/plugin/).

**What installs today.** lemonfiber offers a plugin only what its
[extension points](/plugins/extension-points/) need: contributing checks and
remedies to `lemonfiber doctor`. A plugin that asks for anything else, such as
adding a service (`service.add`) or watching its health
(`service.health.http`), is refused, and the refusal names what it asked for.
Every plugin in the catalogue adds a service, so none of them installs yet.

## Ask for the offer

```sh
lemonfiber plugin install ./my-plugin
```

Named on its own, `install` settles everything the real install would settle and
writes nothing. It says which services would run and from which image and
digest, where each is published, what it would mount, what capabilities it would
fill, which settings it would change, what secrets it would hold, what it may
reach, and which proofs it would have to pass. Read this before a stranger's
service is on your machine: it is the whole of what the plugin can do, because a
manifest has no field for anything more. It ends by printing a name for the
offer.

The same account, without anything on the stack, comes from
`lemonfiber plugin claims <path>`, which is the author's check — see
[writing a plugin](/plugins/writing-a-plugin/).

## Take it

```sh
lemonfiber plugin install ./my-plugin --offer <NAME>
```

Answering with the offer's name is the yes. The source is read again first, and
an answer given for a different reading is refused, naming what moved
(`PLUGIN-25`). Every value a recipe would send to another host is listed in the
offer, and each is approved as itself with `--approve <VALUE@DESTINATION>`, once
for each.

The manifest is held to the published schema, capability vocabulary and
extension points before anything is written, and a refusal is total: none of it
is acted on. Then the container lemonfiber writes from it is started, and two
gates have to hold, in order:

1. **The plugin's own proofs** — the requests its manifest says must answer a
   certain way — run against the live service.
2. **The stack's own checks**, read before the install and again after, must not
   have got worse.

If either fails, the install is put back through the same journal every other
change goes through, and the report says what was reversed. Only when both hold
is the plugin written into the record of what is installed, `plugins.json` in
lemonfiber's configuration directory. A plugin can therefore never be recorded
as installed without having proved itself.

Installing a plugin that is already installed is refused. From the same source
it is an update, and the refusal says so (`PLUGIN-5`). From another source it is
a second plugin under a name the first already holds, and the refusal names both
sources and leaves which one runs to you (`PLUGIN-14`).

## See what is installed

```sh
lemonfiber plugin installed
```

For each plugin: where it came from and whether anybody reviewed it, when it was
installed, its licence, what it claims and fills, what it added, what it may
change, where it may reach and what it holds, and how each of its services is
reached. It is read from the record rather than from any manifest, so it still
answers after the plugin's source is gone, and whether each source can still be
fetched is asked as it lists them: a directory is looked for, and a git source is
asked for the commit it serves by default. A record that exists and cannot be
read is refused rather than reported as _no plugins_.

## Update it

```sh
lemonfiber plugin update my-plugin ./my-plugin
```

The first word is the plugin's id, as `plugin installed` lists it, and the second
is the new version's source, any an install takes. Named on its own it says what
would go back, what the new version would write and prove, and what would stop
meanwhile, and prints a name for that offer; answering with `--offer <NAME>` is
the yes. One operation, not a removal followed by an install you have to get right. The
installed version comes off the way a removal takes it, the new one goes on the
way an install puts it on — proved, and held against the stack's checks as they
read before the update began — and the record is written last. If the new
version does not hold, it is put back and the old version is restored from its
record. At every moment the machine is on one version or the other.

## Remove it

```sh
lemonfiber plugin remove my-plugin
```

Removal takes the plugin's id, as `plugin installed` lists it, and puts back
everything installing it wrote. Named on its own it says what it would stop, what
it would put back and what the machine would be left without, and prints a name
for that offer; answering with `--offer <NAME>` is the yes. It is the rollback layer's work with a name on
it, so it refuses what that layer refuses: a setting you edited by hand since the
install is left alone rather than overwritten, and a change something later
depends on waits until that goes back first. Where a change re-pointed where data
lives, the report says plainly that the data does not move back with it.

There is no _disable_. A plugin is installed or it is not.

## When it goes wrong

`install`, `update` and `remove` each accept `--dry-run`, which answers an offer
the same way and writes nothing, and a rehearsal exits zero. A real run exits non-zero when an install went back, an update did not
hold, or a removal left something standing. Every refusal carries a code in the
`PLUGIN` family; what each means and what to do is on
[the `PLUGIN` codes page](/fixing/codes/plugin/).
What an install wrote before it stopped is on the change record, which
`lemonfiber history` reads.

## Where to go next

Once a plugin is on, [capabilities and wiring](/plugins/capabilities-and-wiring/)
explains how the stack comes to use it, and
[trust and provenance](/plugins/trust-and-provenance/) how to tell what it did.
