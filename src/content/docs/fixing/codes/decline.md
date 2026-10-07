---
title: DECLINE — the service that answers an invitation's decline
description: Every DECLINE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by the doctor. The decline service's key administers the whole media server, and the service uses it for three things only: declining an invitation, taking back one whose window has closed, and the one proof after the key changes. It records the first two, and the media server dates the key's last use, so a use later than anything the service recorded is one nothing explains.

| Code        | What it means                                                                                                                                                                                                                                                                               | What to do                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DECLINE-1` | The decline service's key was used later than anything the service recorded doing with it. That is either the service doing something it should not, or the key in somebody else's hands. The message gives when it was used, and when the service last recorded something, if it ever did. | If nobody declined an invitation or had one run out then, rotate the key with `lemonfiber credentials rotate`, and check what the decline service is running. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
