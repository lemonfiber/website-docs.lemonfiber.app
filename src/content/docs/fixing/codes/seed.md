---
title: SEED — wiring the services together
description: Every SEED code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised while seeding, when a service will not co-operate. Seeding is resumable: everything already made is valid, and running it again finishes the rest.

| Code     | What it means                                                                                                                                                  | What to do                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `SEED-1` | A service was not answering yet, so it was skipped. Nothing was changed for it.                                                                                | Wait for it to finish starting, then run `lemonfiber seed` again.                                                                        |
| `SEED-2` | A service rejected the credential lemonfiber holds, usually because it was changed in the service's own interface.                                             | Have lemonfiber re-read the service's credential with `lemonfiber doctor --fix`.                                                         |
| `SEED-3` | A service answered in a way lemonfiber does not recognise, so it will not guess at what would fix it.                                                          | Nothing is known to fix this. Send a [support bundle](/fixing/the-support-bundle/); the service's own words are attached to the message. |
| `SEED-4` | A service is past — or stands before — the API version this build speaks, so writing to it would mean writing something malformed. Nothing was changed for it. | Match the service to the version lemonfiber supports, or update lemonfiber, then run `lemonfiber seed` again.                            |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
