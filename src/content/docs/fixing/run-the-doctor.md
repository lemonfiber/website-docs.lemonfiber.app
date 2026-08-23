---
title: Run the doctor
description: What lemonfiber's checks prove, how to read a verdict, and how to let it put right what it can.
sidebar:
  order: 1
---

`lemonfiber doctor` answers one question: is this actually working? It answers it with evidence rather than with optimism.

```sh
$ lemonfiber doctor
```

A full run that disturbs nothing should finish within thirty seconds, and it is safe to run as often as you like.

## What a check proves

A check that reads your configuration and concludes something is not a check. Every one of these establishes its finding by doing the thing.

| A weak check would say                    | What lemonfiber does instead                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| The filesystem is APFS, so hardlinks work | Creates a file, links it, compares the two names, and confirms they are one file                          |
| The VPN container is running              | Asks for the public address from inside the tunnel and from inside the download client, and compares them |
| Port 8989 is configured                   | Binds it, and finds out whether it was free                                                               |
| An API key is present                     | Calls the service, and reads what it answers                                                              |

The difference matters because the failures this stack has are silent. Everything reports green while doing the wrong thing, and you find out weeks later — from a full disk, a stalled queue, or worse.

## Running part of it

Checks are independent. One failing never stops the others, and you can run a single category on its own.

```sh
$ lemonfiber doctor --only vpn
```

| Category      | What it covers                                                       |
| ------------- | -------------------------------------------------------------------- |
| `environment` | Docker present, the daemon reachable, the platform understood        |
| `storage`     | The data location: reachable, writable, one filesystem, room to grow |
| `network`     | Ports free, bindings matching policy, services reachable             |
| `vpn`         | Whether torrent traffic genuinely leaves through the tunnel          |
| `credentials` | Whether each credential is still valid                               |
| `services`    | Health, crash loops, version skew, the wiring between services       |
| `providers`   | Provider quota, subscription validity, indexer responsiveness        |
| `queue`       | Stuck items, repeated import failures, orphaned downloads            |
| `config`      | Drift from what lemonfiber wrote, permissions, manifest validity     |

## Reading a verdict

Each check comes back as one of five things.

| Verdict      | Meaning                                       |
| ------------ | --------------------------------------------- |
| `pass`       | Verified working.                             |
| `warn`       | Working, and degraded or risky.               |
| `fail`       | Not working. Something is broken.             |
| `unverified` | Could not be checked. **This is not a pass.** |
| `skipped`    | Not applicable here, with the reason given.   |

The run as a whole is then one of four.

| Overall    | Meaning                       | Exit code |
| ---------- | ----------------------------- | --------- |
| `healthy`  | Everything checked passed.    | `0`       |
| `degraded` | Warnings, and nothing broken. | `0`       |
| `broken`   | Something failed.             | `1`       |
| `unknown`  | The checks could not run.     | `1`       |

`unknown` exits non-zero on purpose. A script runs the doctor precisely to learn whether the stack is healthy, and reporting success when nothing could be verified is exactly the falsehood these checks exist to prevent.

### Why `unverified` is not a pass

It is the most important verdict and the one most easily wished away. If the address-echo service could not be reached from either container, lemonfiber does not know whether traffic is leaking — and losing the oracle is not evidence of safety any more than it is evidence of danger. The same applies to a check that timed out, and to a killswitch nobody has tested.

Where a check cannot run because something it needs is absent, the answer is `skipped` with the reason, not `fail`. A missing credential is not a broken stack.

## The checks that disturb things

Some things can only be proven by breaking them. The only way to establish that a killswitch works is to drop the tunnel and confirm traffic stops, and that interrupts whatever is transferring.

Those checks never run by default.

```sh
$ lemonfiber doctor --disruptive
```

The run states what it will disturb, and for how long, before it does it. Until one has been run, the thing it would prove reports `unverified`.

## Letting it put things right

A plain run only looks. `--fix` offers to mend what lemonfiber can mend, saying what each repair would do and what else changes if it does, and waiting to be told.

```sh
$ lemonfiber doctor --fix
```

| Flag               | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `--fix`            | Proposes each repair and carries out the ones you confirm           |
| `--yes`            | Carries them out without asking, having decided in advance          |
| `--fix-disruptive` | Includes the checks that disturb the running system while repairing |
| `--undo`           | Puts back what the last repair changed, and nothing else            |

Three things are worth knowing about repairs:

- **A repair proves itself.** After it runs, the check that raised the finding is asked again. A repair that ran without error and left the fault standing is reported as a failure, not a success.
- **A repair that keeps failing stops being offered.** After three attempts that leave the fault in place, lemonfiber stops proposing it. By the third, the cause is something it has not understood.
- **`--undo` reverses one repair.** It does not reverse the wiring lemonfiber seeded, or the choices your first run wrote.

A run where anything was left unmended exits non-zero.

## Answering a warning you have already weighed

Some findings are about a choice rather than a fault. Running torrents without a VPN has a cost, and stating that cost is right — once. Stating it every run is the same warning again, and an operator who has weighed it learns that the tool repeats itself, and stops reading all of it.

```sh
$ lemonfiber doctor --accept vpn.unprotected
```

The finding is suppressed rather than removed: it still exists, still says what the cost is, and still appears when you ask to see everything. It simply stops leading.

Two limits are deliberate. You can only accept something **this run is currently warning about** — naming anything else raises [`ACK-1`](/fixing/every-error-by-code/#ack--answering-a-warning). And only a warning can be accepted. A failure is not something to acknowledge away.

## Machine-readable output

Every command takes `--json`, and the doctor is the one most worth scripting.

```sh
$ lemonfiber doctor --json
```

The human report and the parsed one are the same findings. See [global flags](/commands/global-flags/) for what `--json` does everywhere else, and [the API](/api/) for the envelope it comes back in.

## When the doctor cannot help

If a finding names a code you do not recognise, [every error by code](/fixing/every-error-by-code/) has it. If the report itself is the confusing part, or nothing in it explains what you are seeing, collect [a support bundle](/fixing/the-support-bundle/) — it carries the diagnosis alongside the logs and configuration that produced it.

The requirement all of this is written against is [C1, diagnostics](/spec/10-functional/features/c-trust/c1-diagnostics/). The full flag list is in [every command](/commands/every-command/).
