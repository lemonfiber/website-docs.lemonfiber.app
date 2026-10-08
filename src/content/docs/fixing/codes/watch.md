---
title: WATCH — guarding the data location
topic: use
description: Every WATCH code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber watch`, which stops the forms you name if the data location disappears under them.

| Code      | What it means                                                                                                                          | What to do                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `WATCH-1` | No data location is configured, so there is nothing for a watch to guard.                                                              | Run `lemonfiber setup` to choose a data location, then start the watch again. |
| `WATCH-2` | The data location is already gone when the watch was asked to start. A watch can only guard a location that is present when it begins. | Connect the drive or mount holding the data location, then start the watch.   |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
