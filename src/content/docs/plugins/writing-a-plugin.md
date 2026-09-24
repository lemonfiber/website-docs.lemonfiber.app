---
title: Writing a plugin
description: The author's path from the template to a manifest whose claims are proved, and on to the catalogue.
sidebar:
  order: 5
---

Writing a plugin is writing one file, `plugin.toml`, and the recordings that
prove what it says. There is no plugin SDK, and that is a decision: a plugin is
not a client, holds no connection and speaks no protocol, so a library would
only be a second description of the manifest that could disagree with the
reader. The reasoning is
[F10](/spec/10-functional/features/f-extensibility/f10-authoring/).

## Start from the template

```sh
gh repo create my-plugin --template lemonfiber/plugin-template
```

[The plugin template](/plugins/the-template/) is a working plugin with the
checks already wired. Its author's guide, `docs/development.md`, is the
step-by-step — what to change first, how to record a fixture, how to run the
checks — and it is rendered on this site from the template itself, so follow it
there. The template's `README.md` is the other half: a page with placeholders,
written for the people who will run your plugin, for you to fill in.

## Ask the binary, not a copy

Everything an author writes against is published by the binary, answered with
no network and no stack, each naming the generation it reports:

| Command                               | What it answers                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lemonfiber plugin schema`            | The JSON Schema an editor validates `plugin.toml` against                                |
| `lemonfiber plugin capabilities`      | The capability vocabulary                                                                |
| `lemonfiber plugin extension-points`  | The places a plugin may add a row                                                        |
| `lemonfiber plugin claims <path>`     | What this build makes of your manifest and its recordings                                |
| `lemonfiber plugin provenance <path>` | What the registry says about your image's signature — the one read that uses the network |

The first three are also [the manifest](/plugins/the-manifest/),
[capabilities and wiring](/plugins/capabilities-and-wiring/) and
[extension points](/plugins/extension-points/) on this site, rendered from the
same artefacts at the pinned revision.

`claims` is the one to run on every change. It holds the manifest to all three
documents in one pass, runs every probe a claim binds against the recording it
names, and reports each capability as _demonstrated_, _unproven_ or _refuted_ —
then says what asking for each would come to on the stack: filled, contested or
inert. A refusal or a refuted claim exits non-zero, which is what an author's CI
wants.

## Recordings and proofs

A probe or a proof is a request and what its answer must look like. It is
checked against a **fixture** — a recorded answer from the image at the exact
digest the manifest pins. A fixture recorded from any other image is refused
rather than trusted, and one that is missing or unreadable leaves its claim
_unproven_ rather than failed.

The template commits the outcome of every proof in `proofs.json`, generated
rather than written, so a change in what the proofs say shows up as a diff.
`targets.toml` names the lemonfiber release the plugin is checked against. It is
a fact about the plugin's CI, not about the plugin: a manifest carries no minimum
lemonfiber version, because an install is decided by whether this build offers
what the manifest asks for.

## Getting listed

A plugin is published by being a git repository; nothing else is required to
install it from a clone. To be listed, register it in
[the plugin catalogue](/plugins/the-catalogue/), which records its origin and an
exact reviewed commit and never copies the manifest. How to register, and what
CI checks on a registration, are on that page. A reviewed catalogue that marks an
install _reviewed_ is not built yet; see [what is built](/plugins/#what-is-built-and-what-is-not).
