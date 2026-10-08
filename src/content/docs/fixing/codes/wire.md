---
title: WIRE — choosing what fills a capability
topic: use
description: Every WIRE code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber wiring fill`, which chooses the service that answers when
something in the stack asks for a capability. Every one of them is raised before
anything is written.

| Code     | What it means                                                                                                                                                                                                                                                                     | What to do                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `WIRE-1` | There is no service by that name in this stack, so it cannot fill anything. Nothing was changed.                                                                                                                                                                                  | List the services with `lemonfiber catalogue`, then see what is wired with `lemonfiber wiring`.                      |
| `WIRE-2` | Two readings under one code. As an error: the service does not declare that capability, and pointing everything that asked at it would point them at something that cannot answer. As an advisory: the service already fills it, so nothing was changed and nothing needed to be. | See which services declare it with `lemonfiber plugin capabilities`, and what is wired now with `lemonfiber wiring`. |
| `WIRE-3` | Nothing in this stack asks for that capability, so choosing who fills it would record a setting no wiring reads. Nothing was changed.                                                                                                                                             | See what the stack does ask for with `lemonfiber wiring`.                                                            |
| `WIRE-4` | Which service fills a capability is a setting, and there is no settings file to record it in. Nothing was changed.                                                                                                                                                                | Set this machine up first, with `lemonfiber setup`.                                                                  |
| `WIRE-5` | The choice answers a reading of the wiring that has since moved, or what is installed changed while the choice was being made. Agreeing to it now would be agreeing to something nobody saw, so nothing was changed; the message names what moved.                                | Read the choice again, and answer the name it prints.                                                                |
| `WIRE-6` | The reason given for the choice cannot be recorded with it. A reason is read on one line beside the choice it explains, so it may be at most 280 characters and hold no line break or other control character. Nothing was changed.                                               | Say why in one shorter line, or make the choice with no reason.                                                      |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
