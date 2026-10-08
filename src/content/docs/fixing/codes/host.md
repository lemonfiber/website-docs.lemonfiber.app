---
title: HOST — keeping a command running without a terminal
topic: use
description: Every HOST code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised while handing a long-running command to this machine's service manager, or reading what it already holds.

| Code     | What it means                                                                                                                                           | What to do                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `HOST-1` | This machine has no service manager lemonfiber can configure. The command can still be run, and it will still stop when the terminal running it closes. | Keep the command running yourself, or arrange it with whatever this system uses to start things at login. |
| `HOST-2` | A service definition could not be written. Nothing was installed, so nothing is running and nothing was left behind.                                    | Check that the directory exists and belongs to you, then try again.                                       |
| `HOST-3` | The service manager refused what it was asked. The definition that had been written was removed again, so nothing is half-installed.                    | Read what it said below, then try again once that is dealt with.                                          |
| `HOST-4` | This machine will not say where lemonfiber keeps its own files.                                                                                         | Set a home directory for this account, then install it again.                                             |
| `HOST-5` | This run cannot say where its own program is, so there is nothing to name in a service definition.                                                      | Run this again from an installed copy of lemonfiber rather than a piped one.                              |
| `HOST-6` | The guard is to be hosted against nothing — it was not told what to guard.                                                                              | Name the forms to guard, as you would when running the guard yourself.                                    |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
