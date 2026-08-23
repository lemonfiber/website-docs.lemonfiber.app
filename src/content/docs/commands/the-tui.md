---
title: The terminal interface
description: The dashboard and the scrollable log viewer, the keys they answer to, and how they degrade.
sidebar:
  order: 2
---

Two full-screen views run in a terminal: the dashboard and the log viewer. Both
take the terminal into raw mode and the alternate screen, and both put it back
whatever happens — on the ordinary way out, on an error, and on a panic alike.
Leaving raw mode on would hand you a shell that no longer echoes, so the restore
is not left to the code remembering to do it.

## Getting to them

Run `lemonfiber` with no subcommand at all. What happens depends on the machine
and on whether anybody is watching.

| Situation                                                       | What a bare run does                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Not set up yet                                                  | Says no configuration was found and offers to set it up                               |
| Setup interrupted part-way                                      | Picks the same conversation back up                                                   |
| Set up, and a person is at the terminal                         | Opens the dashboard                                                                   |
| Set up, and nobody is watching — a pipe, a cron line, a CI step | Prints where to go next and exits, rather than drawing to nothing and never returning |

The log viewer is `lemonfiber logs --watch`. Without `--watch` the same lines are
printed to the terminal, and `--follow` keeps that stream open; the viewer is the
version you can scroll back through and filter.

## The dashboard

A header line, seven panels, and a footer reminding you of the keys.

The header is the health summary and whether the screen is current. Those are
two different questions — how the stack is doing, and whether what you are
looking at is fresh — and they disagree in both directions, so they are said
separately.

The panels are read in the order they matter: what is wrong first, then what is
happening, then what it is running on.

| Panel     | What it carries                                                |
| --------- | -------------------------------------------------------------- |
| VPN       | The tunnel, and whether traffic is actually leaving through it |
| Transfers | What is downloading now, with progress, speed and an estimate  |
| Queues    | What each library manager has waiting                          |
| Storage   | Free space, and what that comes to in time                     |
| Services  | What is up                                                     |
| Stuck     | Downloads that have stopped making progress                    |
| Alerts    | What the checks have raised                                    |

From 96 columns wide the panels sit in two columns; below that they stack into
one. Every panel gets a place either way — dropping one would leave you looking
for something that is simply not on the screen.

It gathers afresh about once a second, and only once the previous gather has
finished, so a stack that takes three seconds to answer refreshes every three
rather than queueing up gathers it will never catch up on. A gather in flight
never holds up a keypress: a quit typed during a slow refresh is acted on at once.

| Key                  | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `q`, `Esc`, `Ctrl-C` | Leave                                                     |
| `r`                  | Gather again now rather than waiting for the next tick    |
| `?`                  | Show what the words on this screen mean, or put them away |

`Ctrl-C` is handled explicitly because a terminal in raw mode no longer turns it
into a signal, and an operator who cannot leave with it is trapped.

## The log viewer

Lines from every service you asked for, interleaved, each tagged with the service
that said it. The heading names the services in view and any filter in force; the
footing says whether you are following the tail or reading back through it.

| Key                  | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `/`                  | Start typing a filter                                             |
| `s`                  | Move to the next service, or back to all of them                  |
| `w`                  | Move up the severity rungs: everything, then info, warning, error |
| `c`                  | Clear the filters                                                 |
| `Up`, `Down`         | Read further back, or nearer the newest line                      |
| `End`, `f`           | Jump back to the newest line                                      |
| `e`                  | Export what is in view, through redaction                         |
| `?`                  | Show what the words on this screen mean, or put them away         |
| `q`, `Esc`, `Ctrl-C` | Leave                                                             |

While a filter is being typed every printable character is text rather than a
command, which is the whole reason the mode exists — searching for `queue` should
not have the `q` close the screen out from under you. `Backspace` rubs out,
`Enter` applies, and `Esc` abandons what you were typing while leaving the filter
that was already in force alone.

Two behaviours are worth knowing. A service in a restart loop can write faster
than any screen can draw, so a pass takes a bounded number of the waiting lines
and lets the oldest of the rest go — counted, and said on the screen, rather than
dropped quietly. And the stream ending is not the screen ending: a stopped
service has plenty worth reading in what it said on the way down, and closing the
view at that moment would take it away exactly when it is wanted.

`e` writes the view to a file beside you, named for the moment it was written.
The text goes through the same redaction the support bundle uses, and the file is
read back before the screen claims it is there. An export cannot proceed without
real randomness from the machine: a stand-in you could predict is a way back to
the value it stands for, and saying so beats writing a file whose redaction is
only as good as a fixed salt.

## How it degrades

A locale naming a non-UTF-8 character set, or `C`/`POSIX`, folds output to ASCII.
`NO_COLOR` stops the viewer adding colour, by the variable's presence rather than
its value. A narrow terminal carries less at a time and never overlaps. A
terminal that will not go into raw mode is told so plainly instead of being given
a blank screen.

## What is specified and not yet built

The [TUI specification](/spec/30-repos/lemonfiber-tui/) describes more screens
than exist today: a doctor screen with fixes offered inline, a form switcher
showing the closure preview before it acts, a household screen with invitations
and terminal QR codes, and the setup wizard as one step per screen with a
progress rail. Those are specified and not yet built. The dashboard and the log
viewer are what runs now.

## Where to go next

Everything the dashboard shows has a non-interactive equivalent: `ps`, `logs`,
`doctor` and `stuck` are all in [the commands](/commands/), and all of them take
[`--json`](/commands/global-flags/). For what those checks mean rather than how to
reach them, [when something is wrong](/fixing/) starts with the doctor.
