---
title: FORM — choosing what to run
description: Every FORM code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised when a form cannot be resolved into something to start. See [forms and slices](/running/forms-and-slices/).

| Code     | What it means                                                                                                                                           | What to do                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `FORM-1` | No form was named, so there is nothing to start.                                                                                                        | Name a form, or list the ones this stack has with `lemonfiber forms`.                      |
| `FORM-2` | The stack declares no form by that name. Forms come from the stack rather than from lemonfiber, so a stack of your own may name them differently.       | Use one of the names it offers. The message suggests the nearest match and lists the rest. |
| `FORM-3` | One of the forms you named has to run on its own — what it starts would conflict with the others rather than add to them.                               | Run that form by itself.                                                                   |
| `FORM-4` | Everything these forms would start needs a download provider, and none is configured. Starting them would give you services that cannot fetch anything. | Add a Usenet provider, or a VPN and a torrent client, with `lemonfiber setup`.             |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
