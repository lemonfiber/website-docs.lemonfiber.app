---
title: The support bundle
description: Ask for help without publishing your credentials — what a bundle holds, how it is redacted, and how to check it before you share it.
sidebar:
  order: 6
---

When something is wrong beyond what you can diagnose, you post on a forum or open an issue. What you need to share is genuinely sensitive: configuration holding API keys, logs holding indexer URLs with the key inside them, VPN settings.

What most people do is paste a config file with the parts they recognised as secret taken out. That is the problem. Nobody reliably spots every secret in a forty-line file, and the ones people miss — an API key inside a query string in a log line — are exactly the ones that matter, because they do not look like keys.

```sh
$ lemonfiber support
```

## A bare run writes nothing

The first run collects, redacts, reads the result back looking for anything that still resembles a credential, and then tells you what the bundle would hold and how large it is. It does not create a file.

That is deliberate. The decision to make a file worth attaching to a public thread is one to take **after** seeing what goes into it, not before.

```sh
$ lemonfiber support --write
```

That produces it. And nothing is ever sent anywhere: the bundle is written where you are and stays there.

## What goes in one

| Piece               | What it holds                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `diagnosis.txt`     | The full diagnosis, one line per finding, worst first, in the words the checks themselves chose |
| `services.txt`      | What each container is doing — its lifecycle and its health                                     |
| `platform.txt`      | The lemonfiber version and what this machine is                                                 |
| `configuration.env` | Your own configuration, redacted                                                                |
| `logs.txt`          | A bounded recent window of each service's logs                                                  |

Alongside those, the bundle records the lemonfiber version, the stack version and the time it was taken — so somebody reading an old one knows it is old.

**Anything that could not be read is named rather than passed over.** A bundle is wanted precisely when a machine is not working, so a collector that refused to produce anything without a complete picture would refuse exactly when it is needed. If the engine could not be reached, or the diagnosis could not run, the bundle says so on its first page and collects the rest.

## Redaction lets things through, rather than taking them out

This is the design decision the whole feature rests on.

A deny-list redacts the patterns known to be secret, and leaks anything nobody anticipated. An **allow-list** emits only the fields known to be safe, and replaces everything else by default.

New secrets arrive constantly — a service adds a field, an indexer uses an unusual parameter name. Under a deny-list every one of those leaks until somebody notices. Under an allow-list they are replaced automatically, and the cost of being wrong is a missing diagnostic field rather than a published credential.

### A replaced value keeps its likeness

A redacted value is replaced by a stable stand-in derived from it, so the same key reads identically everywhere in one bundle:

```text
indexer_api_key: <redacted:a3f1>
...
GET /api?apikey=<redacted:a3f1>&t=search
```

Somebody helping can see that two services point at the same account without ever seeing which account. That preserves the diagnostic signal — _are these the same key?_ — which naive redaction destroys.

The derivation is salted per bundle, so the likeness holds **inside** one bundle and says nothing across two. If the machine cannot produce the randomness that salt needs, no bundle is written at all: that is [`BUNDLE-5`](/fixing/every-error-by-code/#bundle--the-support-bundle), because a stand-in anyone can reproduce is a way back to the value it stands for.

### And it is checked before anything is written

Before the archive is created, the whole of it is read back and scanned for anything that still resembles a known credential. A hit is a hard failure, not a warning: [`BUNDLE-1`](/fixing/every-error-by-code/#bundle--the-support-bundle), nothing written, and the file that produced it named.

Failing closed is the only acceptable behaviour here. This is the one place in lemonfiber where a bug publishes a secret.

## The choices you have

| Flag                 | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `--write`            | Produce the bundle, having seen what it would hold                     |
| `--out <path>`       | Write it somewhere other than the current directory                    |
| `--logs <lines>`     | How many log lines to take from each service. Two hundred by default   |
| `--filenames`        | Include media filenames, which are replaced by default                 |
| `--reveal <setting>` | Show one setting as it really is, named exactly as the bundle names it |
| `--confirm`          | Confirm the settings named by `--reveal`                               |

Two of those are worth a note.

**Media filenames are replaced by default.** A library's contents are not a credential, but they are the one thing in a bundle that says something about you rather than about the machine. They are replaced by stand-ins, which keeps two mentions of one file recognisable as one file, so a diagnostic is still followable.

**`--reveal` needs `--confirm` on the same run.** Showing a setting as it is puts the real value into a file people post in public, so it takes saying twice — a flag that publishes a credential is not one to honour because it turned up on a command line somebody copied. Without the confirmation you get [`BUNDLE-4`](/fixing/every-error-by-code/#bundle--the-support-bundle). The bundle also records which settings were revealed, so whoever reads it knows.

## When it will not write

| Code                                                                  | Why                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`BUNDLE-1`](/fixing/every-error-by-code/#bundle--the-support-bundle) | The finished bundle still held something that reads as a credential      |
| [`BUNDLE-2`](/fixing/every-error-by-code/#bundle--the-support-bundle) | Not enough room, with space left over for the machine to keep working in |
| [`BUNDLE-3`](/fixing/every-error-by-code/#bundle--the-support-bundle) | The archive could not be written. Nothing partial is left behind         |
| [`BUNDLE-4`](/fixing/every-error-by-code/#bundle--the-support-bundle) | A `--reveal` was asked for without `--confirm`                           |
| [`BUNDLE-5`](/fixing/every-error-by-code/#bundle--the-support-bundle) | The machine could offer no randomness to derive stand-ins from           |

Two codes elsewhere on the site point you here rather than offering advice: [`STACK-3`](/fixing/every-error-by-code/#stack--the-stack-description) and [`SEED-3`](/fixing/every-error-by-code/#seed--wiring-the-services-together). Both mean lemonfiber does not recognise what happened and will not guess. Admitting that costs you a bundle; a confident wrong guess would cost you an afternoon.

## Before you share it

Open it. The whole point of writing it locally is that you can read every line before anyone else does. Check `configuration.env` in particular — that is where your own settings are, and where a value you added by hand would show up if the allow-list has never seen it. If you find one, that is worth reporting on its own.

Then take it to [where to ask](/contributing/where-to-ask/), which lists the places this project answers questions.

## Related

- [Run the doctor](/fixing/run-the-doctor/) — the diagnosis the bundle carries
- [Every error by code](/fixing/every-error-by-code/) — the five `BUNDLE` codes, side by side
- [C4, the support bundle](/spec/10-functional/features/c-trust/c4-support-bundle/) — the requirement this is written against
