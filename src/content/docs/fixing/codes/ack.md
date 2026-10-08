---
title: ACK — answering a warning
topic: use
description: Every ACK code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber doctor --accept`, which records that you have weighed a choice and its cost so it stops leading.

| Code    | What it means                                                                                                                                | What to do                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ACK-1` | The check you named is not something this run is warning about. An answer is only meaningful against something the tool is currently saying. | Answer one of the warnings this run raised — the message lists them. If it raised none, run the checks first. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
