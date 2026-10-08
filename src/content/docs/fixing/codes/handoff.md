---
title: HANDOFF — pointing somebody's device at the stack
topic: use
description: Every HANDOFF code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber household handoff`, which hands somebody's phone or television the way onto the stack and asks the media server whether it arrived. An invitation makes the account; a hand-off points a device at it.

| Code        | What it means                                                                                                                                                                                                  | What to do                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `HANDOFF-1` | The hand-off is for nobody — the name was blank. The name is the account their device signs in to, so a blank one leads nowhere.                                                                               | Give the name they sign in as, as in `lemonfiber household handoff ana`.    |
| `HANDOFF-2` | This stack has no media server, so there is nothing for a device to sign in to. A hand-off points somebody's device at the media server and proves it signed in.                                               | Add a media server to the stack and run setup.                              |
| `HANDOFF-3` | The media server's own account has not been set up yet. Finding somebody's account and the devices signed in to it is done as the administrator, and this machine has not recorded one.                        | Run `lemonfiber setup`, so the media server's account is made and recorded. |
| `HANDOFF-4` | The account named administers the media server, so it is not one to hand over. This is the account lemonfiber signs in as, and a device handed it could change what everybody else in the household may watch. | Invite the person under a name of their own, and hand that over.            |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
