---
title: Remote access
description: Watching from outside the home without opening a port you do not understand. Specified in full, and not yet built.
sidebar:
  order: 5
---

**This is specified and not yet built.** Nothing described below runs today. It
belongs to the v2 work, and the normative account is
[I1 remote access](/spec/10-functional/features/i-remote-access/i1-remote-access/)
together with
[I2 household identity](/spec/10-functional/features/i-remote-access/i2-identity/).
This page exists so you can see what the shape will be, and so you are not left
guessing whether a missing feature is missing or merely undocumented.

## What runs today

The stack has two binding tiers and no remote path. Administrative services are
published on `127.0.0.1` and that is not configurable. Household services —
the media server, the request portal, the reading and listening apps, the
dashboard — are published on the LAN address you set, because a library the
television cannot reach is not a library.

Reaching any of it from outside the house means doing it yourself today, and the
LAN tier assumes the network is trusted, which a shared flat or a café is not.

## What is specified

### It refuses a proprietary control plane

Remote access must not depend on a service whose coordination plane is closed, or
whose terms forbid the traffic. Cloudflare Tunnel is refused as a built-in path
for both reasons: the tunnel is coordinated by Cloudflare, and its terms restrict
video streaming, which is the use case. Documentation may name it as something
you can wire by hand; lemonfiber will not configure it as a default.

### It picks the archetype from the network, not from a guess

What the line **is** decides which options can work at all, so it is established
first by comparing the router's WAN address against a publicly observed one. A
mismatch means the carrier owns the public edge and no inbound port can ever
arrive. You are told which condition was found and why it narrows the choice,
rather than being offered a path that cannot work on your line.

| Archetype                     | What it is                                                                                                                                                         | When                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Overlay network (the default) | A self-hosted control plane with unmodified clients and a self-hosted relay, so no third party ever coordinates or carries traffic. Works behind carrier-grade NAT | Any line                                       |
| Public ingress                | The bundled reverse proxy terminates real public TLS, with a dynamic-DNS updater keeping the record pointed at the home address                                    | Only where a publicly reachable address exists |

The overlay is the default because it is the only one that works on every line
and never exposes a service to the open internet. Public ingress is refused
outright unless authentication is in place — never merely warned about.

### It cannot automate your router, and says so

No universal interface forwards a router port, and turning on the router's
automatic port-mapping protocol to get one is a security regression the tool will
not make. Where a path needs an inbound port, lemonfiber generates the exact rule
to add and then verifies from outside whether it took. It does not pretend to
have done the step it cannot do.

### It proves reachability from outside

A tunnel showing "connected" locally proves nothing about whether the household
can reach the media server. The check that matters runs from an off-network
vantage, and it asserts several separate things.

| Proof                  | What it establishes                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| End-to-end reach       | A known endpoint answers over the path, with the expected server identity                                                           |
| TLS validity           | The certificate chains to a public root, matches the hostname, and is not near expiry                                               |
| Handshake liveness     | A recent handshake, and traffic counters that are advancing                                                                         |
| Direct or relayed      | Whether the overlay connection is direct. A relayed path can be dramatically slower, and is reported as relayed rather than as fine |
| DNS correctness        | The hostname resolves to the current address, which catches a stale dynamic-DNS record                                              |
| No accidental exposure | A service meant to be tunnel-only is not also answering directly on the WAN                                                         |

A proof that could not run is distinguished from one that ran and failed. A
household device being offline makes a result inconclusive, not negative.

### Identity is the gate, not an extra

Nothing protected is exposed until authentication exists. A self-hosted,
open-source identity provider issues one identity per household member. Apps that
speak a standard single-sign-on protocol authenticate against it directly; the
administrative apps, which do not, are protected by forward-authentication at the
bundled reverse proxy rather than left to their own local logins. If the provider
is unreachable, protected routes fail closed.

A household member experiences exactly one account — the media login they already
have — and never meets the provider as a separate thing to register with. The
operator's identity is distinct from a member's, so the surfaces each can reach
are not the same account.

And the gate is proved rather than assumed: a real login round-trip is driven,
and a protected route is asserted to refuse an unauthenticated request and admit
an authenticated one. A rule that exists but was never exercised does not count
as protecting anything.

### Nothing here costs the scripter the wizard-free path

Enrolling a device, issuing and rotating a key, provisioning the provider, and
running the reachability proof are each reachable as plain subcommands.

## Where to go next

The two specification pages are
[I1 remote access](/spec/10-functional/features/i-remote-access/i1-remote-access/)
and
[I2 household identity](/spec/10-functional/features/i-remote-access/i2-identity/).
The egress-proof machinery this reuses from the outside is the same one behind
[is my VPN hiding me?](/fixing/is-my-vpn-hiding-me/), and the household side of a
running stack today is
[requests and the household](/running/requests-and-the-household/).
