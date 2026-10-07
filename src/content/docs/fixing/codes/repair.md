---
title: REPAIR — putting right what the doctor found
description: Every REPAIR code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber doctor --fix`, which offers repairs, and `--undo`, which puts the last one back. See [run the doctor](/fixing/run-the-doctor/).

| Code       | What it means                                                                                                                                                                                                                                                                                                                                                | What to do                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REPAIR-1` | What you agreed to is not what is offered now. A fresh look offers something else, so something changed between reading the offer and answering it. Nothing was carried out.                                                                                                                                                                                 | Ask what could be put right again, and read what it says now.                                                                                                   |
| `REPAIR-2` | This run has nowhere it knows to look for what a repair changed. What each repair changed is recorded in lemonfiber's own directory, and this machine would not say where that is. Nothing was put back.                                                                                                                                                     | Set a home directory for this user, then ask again.                                                                                                             |
| `REPAIR-3` | Saying what could be put right does not include the checks that disturb. Those checks prove themselves by disturbing — the killswitch test takes the tunnel away from the download client, and the release check spends one of the indexers' daily searches — and a run that only says what it would put right has agreed to neither. Nothing was disturbed. | Ask for the diagnosis with those checks in it, with `lemonfiber doctor --disruptive`. Or agree to the repairs first, and the checks that disturb run with them. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
