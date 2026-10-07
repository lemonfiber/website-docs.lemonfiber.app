---
title: TUI — the terminal interface
description: Every TUI code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by the interactive surface. See [the TUI](/commands/the-tui/).

| Code    | What it means                                                                                                                                | What to do                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `TUI-1` | A screen could not be drawn. The terminal stopped accepting output, which usually means it was closed or resized out from under the process. | Run it again in a terminal that stays open. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
