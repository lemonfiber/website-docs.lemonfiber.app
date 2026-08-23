---
title: Runtime engines
description: What actually drives the containers today, and the Podman and container-free paths that are specified but not yet built.
sidebar:
  order: 6
---

Today there is one supported engine: Docker. The Podman and native paths below
are specified and not yet built, and they are marked as such where they start.

## How Docker is driven today

Two routes, deliberately, and the split is not an accident of history.

**Writes go through Compose.** Bringing services up, taking them down and pulling
images are Compose invocations, so what lemonfiber does to your stack is
something you can run yourself, and `--dry-run` can print it.

**Reads go through the engine's own API.** Four things are asked of the daemon
directly, each because Compose is the wrong instrument for it.

| What is asked                    | Why not Compose                                               |
| -------------------------------- | ------------------------------------------------------------- |
| List containers                  | One poll per second across nineteen services                  |
| Read logs                        | It streams, and Compose cannot narrow to a service list       |
| Read resource statistics         | Compose has no equivalent                                     |
| Run a command inside a container | The leak test runs the same command in two network namespaces |

The client is built on first use rather than at construction. The API version has
to be settled with the daemon before anything is asked of it, and settling it is
itself a request — so an operator whose Docker Desktop is still starting can run
`lemonfiber config show` and get an answer. The failure is deliberately not
remembered: a daemon being down is a condition that ends, and an adapter that
cached the first refusal would keep reporting it long after Docker had finished
starting.

Containers are matched back to services by Compose's own project and service
labels rather than by a naming convention lemonfiber would have to keep in step
with, and the listing is filtered by label **at the engine** — so a machine
running several stacks does not send every container over the socket to have most
of them discarded.

Docker Compose v2.20 or newer is required, because the stack's `compose.yml` uses
`include:`.

None of the test suite needs Docker installed. The adapter is exercised against a
socket that answers the engine's API with whatever a test wants to say, which
drives the connection, the request, the decoding and the mapping in one pass. A
test that required a real daemon would make the coverage gate depend on what
happened to be running. The mechanics are in
[the engine API notes](/develop/architecture/engine-api/), and the seam it sits
behind is [ports and adapters](/develop/architecture/ports-and-adapters/).

## What is specified and not yet built

Three specification pages describe running the stack on something other than
Docker. All three are drafts and none of them is implemented.

### One interface over several engines

[J1 engine abstraction](/spec/10-functional/features/j-runtime/j1-engine-abstraction/)
is the foundation. lemonfiber would detect which engines are installed and
classify each as usable, present-but-unusable, or absent — usability established
from an actual round-trip command, never from a socket or a binary merely
existing. Bring-up, teardown, inspection, in-container execution and health reads
would be expressed once and mapped onto whichever engine is selected.

The load-bearing property is not that the control commands work. It is that
**the verification suite is the same suite, unchanged**: the VPN egress proof, the
hardlink inode proof and the per-service health checks run byte-for-byte
identically on every engine. They are namespace-level and filesystem-level
observations of the running result, not readings of a compose file, so an
abstraction is judged behaviour-preserving only when the identical proofs pass on
each engine. A capability an engine cannot express is named rather than silently
skipped, and a proof that could not run is distinguished from one that ran and
passed.

### Podman

[J2 Podman](/spec/10-functional/features/j-runtime/j2-podman/) describes two
authoring modes. **Compatibility** drives the existing forms and compose
descriptions against Podman's Docker-compatible interface. **Native units**,
Linux only, generate system-managed unit files that reproduce the topology rather
than just the containers: the download client joining the VPN container's network
namespace, ordering that waits for a dependency to be reported healthy rather
than merely started, and units that survive a reboot.

It is honest about rootless. Rootless Podman conflicts with what the VPN
container needs — an elevated network capability and access to the tunnel device
— so the specification leads with a rootful recipe rather than pretending
rootless is free, and re-proves the tunnel on every start rather than assuming a
recipe that worked once still holds.

### No containers at all

[J3 native](/spec/10-functional/features/j-runtime/j3-native/) is the
highest-effort path: services running as host services under the init system,
with no container engine anywhere. What a shared network namespace gave for free
would be rebuilt explicitly — a dedicated namespace holding the VPN interface,
the download client bound into it, and a rule inside the namespace ensuring that
if the tunnel drops there is no route out at all.

Hardlinks are the one thing this path makes easier: with no container filesystem
boundary and no user-id shifting, downloads and media share one host mount. It is
still proven rather than assumed. The killswitch is proven the honest way, by
bringing the tunnel interface down and asserting there is then no egress.

The specification also states what the path costs, which is the VPN provider
abstraction the container was giving you.

## Where to go next

[Running without lemonfiber](/advanced/without-lemonfiber/) is the other way to
take the engine into your own hands, and it works today.
[The architecture notes](/develop/architecture/) cover how the core is put
together behind these seams.
