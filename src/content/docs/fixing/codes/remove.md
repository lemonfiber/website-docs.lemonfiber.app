---
title: REMOVE — taking somebody out of the household
topic: use
description: Every REMOVE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised while removing somebody from both services they hold an account on.

| Code       | What it means                                                                                                                                                                            | What to do                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `REMOVE-1` | No name was given, so there is nobody to remove. Removing somebody takes the name their account is held under.                                                                           | Name the person, as they appear in `lemonfiber household`.                                                              |
| `REMOVE-2` | This stack has no media server, so there is no household to remove anybody from. A household member is an account on the media server; without one there is nobody to take away.         | Add a media server to the stack and run setup.                                                                          |
| `REMOVE-3` | The media server would not say who holds an account, so nobody was removed. Removing somebody starts by finding their account, and that read did not answer.                             | Check the media server is running, then run this again.                                                                 |
| `REMOVE-4` | Nobody by that name is in this household. Nothing was removed — the name has to match an account the media server holds, though not its capitalisation.                                  | Run `lemonfiber household` to see who is here.                                                                          |
| `REMOVE-5` | The account named administers the media server, so it is not one to remove. The server refuses to be left without an administrator, and this is also the account lemonfiber signs in as. | Remove a household member instead. To hand the server to somebody else, do it in the media server's own settings first. |
| `REMOVE-6` | The media server would not remove that account, so nothing was removed. Nothing else was touched: the request service is only asked once the media server's account is gone.             | Check the media server is running, then run this again.                                                                 |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
