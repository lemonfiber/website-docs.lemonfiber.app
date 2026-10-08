---
title: BIND — where the stack is actually listening
topic: use
description: Every BIND code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by the check that asks the container engine what it published, rather than reading what a file meant to publish. See [run the doctor](/fixing/run-the-doctor/).

| Code     | What it means                                                                                                                                                                                                                                                                                                             | What to do                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BIND-1` | A service the stack calls an admin service is reachable from your network. It is meant to answer this machine and nothing else: it can change how your stack works, and most services like it have weak or no password of their own, so anything on your network reaching it is a way in.                                 | Publish it on this machine only, and apply the change. The message names the address to use. Or, if you meant to expose it, say so once and say why, with `LEMONFIBER_EXPOSED=<service>=<why>` in your settings.                        |
| `BIND-2` | A firewall rule on this machine may not apply to the ports the stack publishes. The container engine runs directly on this machine here, and it writes its own forwarding rules ahead of the ones you add, so a port you believe is shut may still answer. This is how publishing is meant to work and nothing is broken. | Narrow what the household tier is published on, which is what does decide: `LAN_BIND` in your settings, set to this machine's own address on your network. Or leave it, if every device on this network is one you would let in anyway. |
| `BIND-3` | An admin service is reachable from your network and you have written down that you meant it to. It is still reported, because the exposure is real either way; what changed is whose decision it is. The message quotes your reason back.                                                                                 | Nothing, if that is still true. Or take it out of the exposed list and publish it on this machine only.                                                                                                                                 |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
