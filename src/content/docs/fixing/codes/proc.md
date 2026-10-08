---
title: PROC — the program underneath
topic: use
description: Every PROC code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised when the program lemonfiber shells out to is absent or will not run.

| Code     | What it means                                                                                                       | What to do                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `PROC-1` | The program lemonfiber drives the engine through is not installed, so nothing can be started or stopped.            | Install Docker Desktop, or Docker Engine on Linux.     |
| `PROC-2` | The program is installed and would not start. Usually a permission or daemon problem rather than a missing install. | Check the container engine is running, then try again. |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
