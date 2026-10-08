---
title: WIRING — drift between services
topic: use
description: Every WIRING code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised when a download client no longer files where lemonfiber wired it. See [adopt and reset](/advanced/adopt-and-reset/).

| Code       | What it means                                                                                                                                                                                                                                                                                                                                  | What to do                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WIRING-1` | A service and its download client have drifted apart. Either the client still files under a category lemonfiber has moved on from, so anything filed since is somewhere the rest of the stack no longer looks; or you moved the client off lemonfiber's category and the service can no longer reach it, so the queue fills and never empties. | Let lemonfiber bring it up to date with `lemonfiber doctor --fix`. To keep your own value instead, adopt it with `lemonfiber adopt`; to discard it and restore lemonfiber's, run `lemonfiber reset --confirm`. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
