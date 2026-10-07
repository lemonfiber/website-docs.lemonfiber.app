---
title: RATE — holding the stack to a share of the line
description: Every RATE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised while reading or setting what the stack may take of your connection.

| Code     | What it means                                                                                                             | What to do                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `RATE-1` | A limit was expressed as a share of a line nothing has measured, so the share is not a limit.                             | Say what the line carries, or give a figure instead of a share.                 |
| `RATE-2` | A schedule was asked for and nothing says which zone the download clients would read it in.                               | Set the zone, then ask again.                                                   |
| `RATE-3` | What was asked for could not be read as a limit, a window or a cap. A cap has to be told what happens when it is reached. | Say what happens at the cap: `--when-exceeded pause`, `throttle` or `continue`. |
| `RATE-4` | There is no download client on this stack to hold to a limit.                                                             | Start a form that has a download client in it.                                  |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
