---
title: GATE — the request gate
description: Every GATE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by the doctor, which reads the request gate's record. The gate stands between the request service and Sonarr, Radarr and Jellyfin, and builds each call on its fixed list itself; a call outside that list is refused and recorded.

| Code     | What it means                                                                                                                                                                                                   | What to do                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `GATE-1` | The request gate refused calls since the last check: something reaching the request service asked Sonarr, Radarr or Jellyfin for more than requests need, and the gate stopped it. The message lists the calls. | If nobody changed the request service's settings, check what it is running. |
| `GATE-2` | More entries reached the gate's record between two checks than it keeps, so some were dropped before they were read. What those entries were cannot be told now; the message says how many.                     | Run the diagnosis more often while this keeps happening.                    |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
