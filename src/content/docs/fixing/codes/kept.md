---
title: KEPT — what lemonfiber keeps here
description: Every KEPT code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber stored` and `lemonfiber forget`, which list what lemonfiber keeps on this machine and remove it.

| Code     | What it means                                                                                                                                                                                                                                                                                                               | What to do                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `KEPT-1` | This run cannot say where lemonfiber keeps its own files. The configuration and data directories are worked out from this machine's own conventions, and that did not work here, so there is nothing to list and nothing safe to remove. Guessing at the usual place would risk naming a directory that is somebody else's. | Run this as the account that installed lemonfiber, on a machine with a home directory it can read. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
