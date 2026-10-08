---
title: REISSUE — letting somebody set a new password
topic: use
description: Every REISSUE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised while making an account claimable again, so its holder can choose a password you never see.

| Code        | What it means                                                                                                                                                                                      | What to do                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `REISSUE-1` | The media server would not say who holds an account, so nothing was reset. Making an account claimable again starts by finding it, and that read did not answer.                                   | Check the media server is running, then run this again.                                                             |
| `REISSUE-2` | Nobody by that name is in this household. Nothing was reset — the name has to match an account the media server holds, though not its capitalisation.                                              | Run `lemonfiber household` to see who is here.                                                                      |
| `REISSUE-3` | The account named administers the media server, so its password is not one to reset. This is the account lemonfiber signs in as, and taking its password away would leave nothing to sign in with. | Reset a household member instead. To change the administrator's own password, do it in the media server's settings. |
| `REISSUE-4` | The media server would not reset that password, so nothing changed. Their existing password still works and the account is untouched.                                                              | Check the media server is running, then run this again.                                                             |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
