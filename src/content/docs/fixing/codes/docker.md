---
title: DOCKER — talking to the engine
description: Every DOCKER code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by the engine adapter itself, wherever a command reaches it.

| Code       | What it means                                                                                                                                                                                                                            | What to do                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `DOCKER-1` | The container engine is not running. Nothing about your stack can be read or changed while it is down.                                                                                                                                   | Start Docker Desktop, or the `docker` service on Linux. This is the first thing to fix.                                        |
| `DOCKER-2` | A container that should be up is not. It may have stopped on its own, or never been started.                                                                                                                                             | Start the form that includes it. `lemonfiber ps` shows what is running.                                                        |
| `DOCKER-3` | The host an endpoint names could not be found on the network. The name was looked up and nothing answered to it, so no connection was attempted — the daemon may be running perfectly on a machine this one cannot name.                 | Check the host name, and that this machine can resolve it. Trying the host's address in place of its name tells the two apart. |
| `DOCKER-4` | The host was found and refused the connection. The name is right and something about the endpoint is not: either Docker is not running over there, or it is not listening where the endpoint says.                                       | Check Docker is running on that machine, and on the port the endpoint names.                                                   |
| `DOCKER-5` | The host was reached and would not accept the SSH login. This is about keys and accounts rather than about Docker — lemonfiber uses the SSH configuration you already have and makes no keys of its own.                                 | Connect to the host with `ssh` and read what it says, then try again.                                                          |
| `DOCKER-6` | The endpoint names a transport lemonfiber cannot drive. Nothing was read and nothing was changed, because reading one machine while writing to another is worse than reaching neither.                                                   | Point `DOCKER_HOST` at an `ssh://` or `tcp://` endpoint, or at a local socket.                                                 |
| `DOCKER-7` | A Docker context was named and this machine records no endpoint under that name. Nothing was read and nothing was changed, because falling back to the local daemon would answer about this machine while you were asking about another. | List the contexts this machine has with `docker context ls`, and name one of those.                                            |
| `DOCKER-8` | A remote host did not answer, for a reason nothing here recognises. What the transport said is quoted beside it; it names that machine rather than this one.                                                                             | Read what the transport said. It is the most specific thing known about this.                                                  |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
