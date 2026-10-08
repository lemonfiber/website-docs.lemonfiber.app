---
title: REHEARSE — asking what a command would do
topic: use
description: Every REHEARSE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised when `--dry-run` is given to a command that cannot answer it. Both refuse
rather than going ahead, which is the point of them: the flag used to be accepted and
ignored, so a command that changed things did so and reported a rehearsal.

The two are separate facts and an operator can act on the difference. `REHEARSE-1` is
permanent — finding out what the command would do means doing it. `REHEARSE-2` is a gap
somebody is closing.

| Code         | What it means                                                                                                                                                                                                           | What to do                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `REHEARSE-1` | This command cannot be rehearsed and never will be: what it would find out is only knowable by doing it, so a rehearsal would be a report with nothing in it. Nothing was done. The message says which command and why. | Run the command without `--dry-run` when you mean it.                 |
| `REHEARSE-2` | This command changes things and has not been taught to say what it would change, so it refuses the flag rather than accepting it and going ahead. Nothing was done.                                                     | Run the command without `--dry-run` when you mean it, or wait for it. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
