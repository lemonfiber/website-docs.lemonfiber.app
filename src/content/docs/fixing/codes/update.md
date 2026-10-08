---
title: UPDATE — moving the stack onto newer versions
topic: use
description: Every UPDATE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber update stack`. A bare run changes nothing and says what each step would
cost; `--confirm` takes the steps, behind a backup that is a precondition rather than an offer.
Nothing here reaches a registry — what a service would move to ships inside the binary, so the
only question asked of the machine is which version each service stands on now.

| Code       | What it means                                                                                                                                                                                                                                                                           | What to do                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `UPDATE-1` | What is running could not be read, so no update was worked out. Which version each service stands on is the container engine's answer, and it did not give one. Nothing was changed.                                                                                                    | Start the container engine, then ask again.                                                    |
| `UPDATE-2` | An update was narrowed to one service by a name the stack does not declare. A name matching nothing would otherwise read as a stack already up to date, so it is refused instead. Nothing was changed.                                                                                  | Name one of the services the stack declares; the message lists them.                           |
| `UPDATE-3` | Something is still coming down, and the run was not asked to wait. Updating stops the download clients, and what is part-way down does not always resume where it left off — so a run that would interrupt one is refused rather than carried out. Nothing was changed.                 | Let them finish with `lemonfiber update stack --confirm --wait`, or wait and ask again.        |
| `UPDATE-4` | The stack was stopped so the backup could run against databases nothing was writing to, and the backup would not write. Nothing was updated and nothing opened its state on a newer image, so there is nothing to undo — but the stack is down, because stopping it is what came first. | Bring the stack back up with `lemonfiber up`, then fix what stopped the capture and ask again. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
