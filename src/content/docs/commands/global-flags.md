---
title: Global flags
description: The four flags every lemonfiber subcommand accepts, the ones that only look global, and what the environment decides.
sidebar:
  order: 1
---

Four flags are declared once on `lemonfiber` itself and inherited by every
subcommand. You may type them before the subcommand or after it, and they mean
the same thing either way.

| Flag                 | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `--json`             | Prints machine-readable output                                      |
| `--dry-run`          | Says what would happen, and changes nothing                         |
| `--force`            | Takes the stack from a run that claimed it and did not give it back |
| `--stack-dir <PATH>` | Operates a stack directory of your own instead of the built-in one  |

`lemonfiber --help` and `lemonfiber -h` print help, and `lemonfiber --version`
or `-V` prints the binary's version. Subcommands take `-h` and `--help`; the
short `-V` belongs to the top-level command only.

## `--json`

Every answer has a machine-readable form, and it is the same shape whichever
command produced it: an envelope carrying `api_version`, `kind` and `data`. A
failure is an envelope too — it goes to the error stream rather than into the
answer, so a script reading standard output never has to tell an answer from an
apology.

Machine-readable output is a stable interface, not a convenience. Its shape is
described in [the envelope](/api/the-envelope/) and versioned separately from the
binary, which is [the two version numbers](/api/two-version-numbers/).

Two things behave differently under `--json`. Log streams emit one envelope per
line, because a stream has no last element to close a document with. And the
plain-language footnote a human report prints underneath itself is left off
entirely: it is prose for a person, and appending it to a machine-readable answer
would corrupt the one thing that answer exists to be.

## `--dry-run`

A rehearsal. The run says what it would do, prints the exact underlying
invocation, and writes nothing — including nothing to the records lemonfiber
keeps about itself, such as which words it has already explained to you.

Use it before anything that changes shape: `up`, `down`, `switch`, `seed`,
`restore`. It is also the honest way to read what a command is actually going to
ask Docker for, which is the point of it being there at all.

## `--force`

One lifecycle operation runs against a stack at a time. An operation claims the
stack before it starts and gives it back when it ends, so `down` typed in one
terminal cannot land in the middle of `up` in another and leave the stack in a
state neither command asked for.

A refusal names the run that already holds the claim: which process, and how
long it has been going. Nothing checks whether that process is still alive, so a
run that was killed leaves the stack claimed until somebody says `--force`.
Reach for it when the report tells you the holding run started hours ago and you
know it is gone. A rehearsal claims nothing, so `--dry-run` works whether or not
a real run is in flight.

## `--stack-dir <PATH>`

Operates a stack directory of your own instead of the one embedded in the
binary. The directory needs a `stack.toml` beside a `compose.yml`, and the
manifest is validated before anything runs — every violation reported in one
pass, each naming its location, rather than one per attempt.

This is the escape hatch that makes a fork possible without a lemonfiber
release. What the manifest has to contain is
[the stack manifest](/advanced/the-stack-manifest/).

## Flags that only look global

Several flags recur across commands without being inherited, and they are worth
knowing apart because their meaning is not identical everywhere.

| Flag                  | Where it appears                                     | What it means there                                                                                                                       |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--yes`               | `setup`, `down`, `doctor`                            | Proceed without the prompt this command would otherwise raise                                                                             |
| `--confirm`           | `quality set`, `quality upgrade`, `reset`, `support` | Say yes to the consequence this command has just named — a software transcode, a large re-download, work discarded, or a credential shown |
| `--service <NAME>`    | `up`, `down`                                         | Act on only these services, leaving the rest of the form alone                                                                            |
| `--service <SERVICE>` | `backup`                                             | Back up one service's configuration instead of the whole stack                                                                            |

A command that would throw work away or spend a lot of bandwidth states the cost
first and does nothing until it is confirmed: `reset` names every edit it would
revert, and `quality upgrade` states what re-downloading the back catalogue
comes to. `support` splits the two halves apart — a bare run collects, redacts
and tells you what the bundle would hold, `--write` produces it, and `--confirm`
is only ever about the settings `--reveal` names, because a flag that publishes a
credential is not one to honour because it turned up on a command line somebody
copied.

## What the environment decides

Two environment variables are read, both at the edge of the program rather than
threaded through it.

| Variable                     | Effect                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LC_ALL`, `LC_CTYPE`, `LANG` | Read in that order. A locale naming a non-UTF-8 character set, or `C`/`POSIX`, folds output to ASCII. A locale that is simply unset is not taken as a claim either way |
| `NO_COLOR`                   | The scrollable log viewer adds no colour. The convention is the variable's presence, so `NO_COLOR=0` refuses colour like any other value                               |

Everything else is a setting rather than a variable, kept where
`lemonfiber config set` writes and readable with `lemonfiber config show`. The
plain-language explanations are one of those: they are on unless
`LEMONFIBER_EXPLANATIONS` is set to `off`, `false`, `no`, `0` or nothing at all.

## Where to go next

[Every command](/commands/) lists what these flags apply to, and
[the complete command reference](/commands/every-command/) has the per-command
flags in full. For what `--json` actually emits, start with
[the envelope](/api/the-envelope/) and then [the kinds](/api/kinds/).
