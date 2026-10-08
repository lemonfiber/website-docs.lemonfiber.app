---
title: DIAG — narrowing a diagnosis
topic: use
description: Every DIAG code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber doctor --only`, which runs one category of check, or one check by the name a finding gives it.

| Code     | What it means                                                                                                                                                                                                                         | What to do                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `DIAG-1` | Nothing on this stack reports under the name you narrowed the run to. A check is named by the identifier its finding carries, and no finding here carries that one. Answering with an empty report would read as nothing being wrong. | Run the checks with `lemonfiber doctor`, and narrow to a name this stack reports. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
