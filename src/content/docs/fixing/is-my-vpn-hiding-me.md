---
title: Is my VPN hiding me?
description: How lemonfiber proves torrent traffic is leaving through the tunnel, what it will not claim, and how to test the killswitch.
sidebar:
  order: 3
---

This is the only failure in the whole stack whose consequences reach outside your machine. Every other silent fault costs you disk, time or patience. This one shows your home address to every peer in a swarm.

It is also genuinely hard to check by hand. A running tunnel container proves nothing about your download client's traffic. Checking your address in a browser tells you about the browser. You have no practical way to confirm the thing that matters, so you assume — and assumption is precisely what the check exists to remove.

```sh
$ lemonfiber doctor --only vpn
```

## What the check actually does

It asks the tunnel container what its public address is. Then it asks the download client, **from inside the download client's own network namespace**, the same question. Then it compares the two answers.

| What comes back                                   | What it means                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Both report the same address, and it is not yours | Traffic is genuinely traversing the tunnel                             |
| The client reports your real address              | Leaking. Critical.                                                     |
| The client has no connectivity at all             | The killswitch is holding — the tunnel is down, and nothing is leaking |
| The two differ, and neither is yours              | Misconfiguration; traffic is taking a path nobody asked for            |

This works because the download client shares the tunnel container's network namespace. If that sharing is intact, the two answers have to match. If it is not, the difference shows up immediately — which is exactly the misconfiguration the check exists to catch.

### When it cannot tell

If the address-echo service cannot be reached from either container, the result is `unverified` rather than `pass`. Losing the oracle is not evidence of safety. If it is reachable from one container and not the other, that is a strong signal, and it is reported as a probable leak or a probable killswitch depending on which side answered.

Where two sources disagree, the disagreement is reported rather than resolved by picking one.

## The states it reports

| State                | Meaning                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `verified`           | Tunnel up, egress matches, and where the provider supports it, a port is granted and matches |
| `verified-no-pf`     | Tunnel up and egress matches; the provider offers no port forwarding. Not degraded.          |
| `degraded`           | The provider supports port forwarding, and none was granted or the port does not match       |
| `killswitch-holding` | Tunnel down, download client has no connectivity. Safe.                                      |
| `leaking`            | The client's egress does not match the tunnel. Critical.                                     |
| `unverified`         | Could not be checked                                                                         |
| `not-configured`     | No VPN configured; torrents are disabled, or running without one has been accepted           |

## Port forwarding, and why yours may not have it

Port forwarding is treated as a capability, not as a list of provider names. Every provider the tunnel container supports gets a tunnel, a killswitch and egress verification. Only some of them forward a port.

| Capability                              | Which providers                                                 |
| --------------------------------------- | --------------------------------------------------------------- |
| Tunnel, killswitch, egress verification | All of them                                                     |
| Server-side port forwarding             | ProtonVPN, Private Internet Access, PrivateVPN, Perfect Privacy |

Everything else has none at all. NordVPN discontinued it; Mullvad withdrew it in 2023.

On a provider without it, the port checks report `not-applicable` and are **never** reported as a failure. Nothing is broken, and you cannot fix a feature your provider does not sell. What you lose is real, though, and it is stated once at setup: without a forwarded port, peers cannot open connections to you, so throughput and seeding are both reduced.

### Where the provider does have it

Four separate things have to hold, and each is checked on its own because each fails differently.

1. A port was granted at all.
2. The download client is configured to listen on **that** port.
3. The port is actually reachable.
4. It still matches after a reconnect.

The fourth is the one that bites. **A forwarded port does not survive a reconnect, and a reboot is a reconnect.** Without that check the stack comes back looking perfectly healthy while the client listens on a port the VPN no longer forwards — everything green, incoming connections silently gone. When lemonfiber detects a changed port it re-pushes it to the client and records that it had drifted, rather than waiting to be told.

If you see [`VPN-7`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel), the port and the client have parted company. Running `lemonfiber up` moves the client onto the forwarded port.

### The traps that look like a broken installation

Each port-forwarding provider has one failure mode that reads as a broken stack and is actually a credential problem, and none of them explains it at the point of failure.

| Provider  | The trap                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProtonVPN | Port forwarding has to be enabled **when the WireGuard configuration is generated**, and the server has to support P2P. It cannot be fixed at runtime; it needs new credentials. |
| NordVPN   | The credentials are the **service credentials** from the account dashboard, not the account email and password. The obvious values are rejected with no explanation.             |

Where the tunnel is up and no port was granted on a provider that offers them, that provider's trap is named as the first candidate cause — which is what [`VPN-4`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel) does.

## Testing the killswitch

The only way to prove a killswitch works is to break the tunnel and confirm traffic stops. That interrupts whatever is transferring, so it never runs by default.

```sh
$ lemonfiber doctor --only vpn --disruptive
```

Until it has been run, the killswitch reports `unverified` — not `pass`. Claiming an untested fail-closed guarantee is exactly the comfortable falsehood this whole feature exists to remove.

The test drops the tunnel on purpose and puts it back, and it verifies the restoration before reporting anything. Two outcomes are worth recognising:

- [`VPN-5`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel) — the tunnel went down and the client still reached the internet. Enable the tunnel container's own killswitch. For gluetun that is `FIREWALL=on`, which is its default.
- [`VPN-6`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel) — the tunnel was dropped and putting it back could not be confirmed. Restart the tunnel container now; whether traffic is flowing outside it is exactly what is currently unknown.

## While torrents are running

Egress matching is re-checked periodically while transfers are active, not only when you ask. A leak that begins after startup is still a leak, and it notifies immediately at critical severity.

The exit country is reported too. That is not a pass or a fail, but it is frequently not what you intended, and it affects speed.

## If you have chosen to run without one

That is a decision with a cost, and lemonfiber states the cost once rather than every run.

```sh
$ lemonfiber doctor --accept vpn.unprotected
```

The [`VPN-8`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel) finding stays where it is and stops leading. It is suppressed, not deleted — "you chose this" and "this is not happening" are different claims, and only one of them would be true.

Note that you cannot accept a `leaking` result. Only a warning can be acknowledged; a failure is not something to acknowledge away.

## Related

- [Every error by code](/fixing/every-error-by-code/) — the eight `VPN` codes, side by side
- [Run the doctor](/fixing/run-the-doctor/) — verdicts, categories and repairs
- [C2, VPN verification](/spec/10-functional/features/c-trust/c2-vpn-verification/) — the requirement this is written against
- [J5, the VPN verification journey](/spec/10-functional/journeys/j5-vpn-verification/) — what a whole run of this looks like
