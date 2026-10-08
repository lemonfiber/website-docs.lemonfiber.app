---
title: UNDO — putting a run back
topic: use
description: Every UNDO code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber undo`, and `UNDO-3` also by any command that made a change
and could not record it. A run of changes goes back whole or not at all, so every
refusal `undo` makes comes before anything is reversed rather than part-way through.

| Code     | What it means                                                                                                                                                                                                                                                                                                                                                           | What to do                                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UNDO-1` | No run in the record carries the stamp you asked for. It may have fallen outside the horizon the record keeps, or the stamp may be mistyped. Nothing was put back.                                                                                                                                                                                                      | Run `lemonfiber history` and take the stamp from the entry you want.                                                                                                       |
| `UNDO-2` | The stamp names more than one run, and putting back the wrong one is not something to guess at. Nothing was put back.                                                                                                                                                                                                                                                   | The message names each run the stamp covers; ask for one of them once the surfaces carry it.                                                                               |
| `UNDO-3` | One change in the run cannot be reversed, and a run goes back whole or not at all — so nothing was put back. The message names the change and why it will not go. Raised by a command that made a change, it means the change was made and could not be written to the change journal: the change stands, and cannot be put back, because a reversal reads the journal. | Deal with that change first, or restore from a backup. Where a change could not be recorded, check that lemonfiber's configuration directory can be written and has space. |
| `UNDO-4` | This run has nowhere it knows to look for what was changed. What lemonfiber changed is recorded in its own directory, and this machine would not say where that is. Nothing was put back.                                                                                                                                                                               | Set a home directory for this user and run it again.                                                                                                                       |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
