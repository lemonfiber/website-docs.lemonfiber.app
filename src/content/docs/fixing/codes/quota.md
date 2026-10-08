---
title: QUOTA — what the household may ask for
topic: use
description: Every QUOTA code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised while reading or changing what the household is trusted to request, and while ruling on what it has asked for.

| Code      | What it means                                                                                                                                                                                                                                              | What to do                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `QUOTA-1` | The request service would not answer, so nothing was changed. What was in force before is still in force.                                                                                                                                                  | Check the request service is running, then run this again.                              |
| `QUOTA-2` | A policy that lives inside a limit was chosen without one. Living within a limit needs a limit.                                                                                                                                                            | Say how many requests a period allows, and how long the period is.                      |
| `QUOTA-4` | The request named is not one that is waiting on anybody, so there is nothing to rule on.                                                                                                                                                                   | Ask what the household has asked for, to see what is still waiting.                     |
| `QUOTA-5` | A request was turned down and the reason given was blank. The reason is passed on to whoever asked, so a blank one tells them nothing.                                                                                                                     | Say why in a few words, and pass them on to whoever asked.                              |
| `QUOTA-6` | Nobody in this household goes by the name that was given, so nothing was changed.                                                                                                                                                                          | Name somebody who is here. The message lists the household.                             |
| `QUOTA-7` | The request service holds no account for somebody who has one here. It learns of somebody the first time they sign in to it, and until then there is no account of theirs for a limit to sit on — what the household is held to applies to them meanwhile. | Ask them to open the request service once, then set this again.                         |
| `QUOTA-8` | A run was asked to close what has waited too long, and this household has never said how long that is. A request closed against a period nobody named is one nobody agreed to close.                                                                       | Say how many days a request may wait, as in `lemonfiber household expiring --after 30`. |
| `QUOTA-9` | The period named would close a request nobody was ever reminded about. The reminder and the closing are one arrangement, and a request that goes before the reminder is one nobody saw waiting.                                                            | Name a period of a week or more, so the reminder is reached first.                      |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
