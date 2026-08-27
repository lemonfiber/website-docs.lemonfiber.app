---
title: The web console
description: The five screens a browser gets, what each one answers, and what it can ask the stack to do.
sidebar:
  order: 3
---

The same stack, drawn in a browser. `lemonfiber ui` serves it, and what it draws
is the answer to the same questions the terminal asks — the two surfaces reach
the core the same way, so neither can tell you something the other would deny.

## Getting to it

Run `lemonfiber ui`. It takes a loopback socket — whichever port is free, unless
`--port` names one — and prints the whole address together with a token minted
for that run. Opening that address is the whole of getting in.

Nothing is installed and nothing keeps running afterwards. Stop the command and
the console is gone, along with the token: the next run mints another, so an
address you kept from last time will not let anybody in.

The connection is not encrypted, and it says so as it starts. On loopback that
costs you nothing a program already on your machine could not do anyway. Over a
network it would, which is why `--lan` is refused until `--set-password` has set
one — and why the password is asked for rather than the token, because a token
printed to a terminal is not something you can type from a phone.

## The five screens

| Address     | Screen                | What it answers                                               |
| ----------- | --------------------- | ------------------------------------------------------------- |
| `/`         | Overview              | How the whole stack is doing, and what needs you              |
| `/checks`   | Checks                | What the diagnosis found, and what to do about each finding   |
| `/storage`  | The disk              | What is on the disk, how fast it is filling, and what checked |
| `/logs`     | Logs                  | The scrollback, filtered by service                           |
| `/requests` | What's been asked for | What the household has requested, and where each one got to   |

Each is a real address rather than something the page remembers. That is worth
saying because of what it buys: every screen can be typed in, bookmarked, opened
in a second tab, and left behind by the back button. A screen held in a variable
can do none of those, and a browser is the one surface where people expect all
four.

## The overview

Eight panels, read in the order they matter: what is wrong, then how things
stand, then what is moving.

| Panel                              | What it shows                                  |
| ---------------------------------- | ---------------------------------------------- |
| `What needs you`                   | Anything asking for a decision, first          |
| `How things stand`                 | The health summary for the whole stack         |
| `Your disk`                        | Free space, and whether anything is filling it |
| `What your stack can run`          | The forms the stack declares                   |
| `The programs that run your stack` | Each service and what it is doing              |
| `What you can ask for`             | The actions available, and what each one does  |
| `Waiting in line`                  | What is queued                                 |
| `Downloading now`                  | What is moving right now                       |

A panel whose source stopped answering says so and greys itself, rather than
holding the last value it saw. Stale numbers on a dashboard are worse than none:
they are the shape a working answer has, and nothing about them says how old
they are.

## What it can ask for

Six actions, and every one of them is a command you could have typed:

`up`, `down`, `restart`, `pull`, `seed`, `doctor`.

They are asked for through the same entry point the command line uses, so the
console cannot do anything the terminal cannot, and cannot do it differently.
That is not a limitation it works around — it is the reason both surfaces can be
trusted to describe one stack.

An action that only reads and writes lemonfiber's own files comes back with its
outcome. One that reaches the container engine runs for minutes, so it is
answered straight away with the name of the work, and the work carries on
somewhere the connection cannot reach. A tab closed mid-repair takes nothing with
it.

## What it does not do yet

There is no settings screen, no household view, and no per-person limits — the
words exist in the console's own vocabulary and the screens do not. This console
is the operator's; what somebody who merely lives here is handed is one address,
which `lemonfiber front-door` names.
