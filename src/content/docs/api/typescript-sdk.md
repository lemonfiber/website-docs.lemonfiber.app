---
title: The TypeScript SDK
description: Typed calls, a typed event stream and a typed error, with no runtime dependencies.
sidebar:
  order: 3
---

`@lemonfiber/sdk-ts` is a library with no user interface and no server. It speaks
the [web API](/spec/20-architecture/contracts/web-api/) and exposes it as typed
calls, a typed event stream, and a typed error. It is the only thing the web
surface uses to talk to the core, and the first thing any other consumer should
reach for.

It is a peer of [the PHP SDK](/api/php-sdk/), not its original. Both implement
one specification, and neither is the reference for the other. Where a client
disagrees with the contract, the client is wrong.

**Status: unreleased.** Reads, actions, the event stream and the generated types
are all in; the package is not on npm yet. The surface it talks to is
`lemonfiber ui` — one read endpoint for each question a command answers,
`POST /api/actions/<name>` and `GET /api/events`, on a loopback socket behind a
token minted for that run. [The envelope](/api/the-envelope/) sets the endpoints
out one by one, and has the rest in more detail.

## Install

```console
npm install @lemonfiber/sdk-ts
```

Requires Node 26 or newer, or any modern browser. It has **no runtime
dependencies** — a client library's dependency tree becomes every consumer's.

## Opening a client

lemonfiber prints an address and a token when it starts serving. Pass both in;
the token is sent as a header and never placed in a URL.

```ts
import { Client, follow } from "@lemonfiber/sdk-ts";

const opened = Client.at({
  url: "http://127.0.0.1:9000", // loopback only — anything else is refused
  token: printedByLemonfiber,
  sending: fetch,
});
if (!opened.ok) throw new Error(opened.problem.message);
```

`Client.at` returns either `{ ok: true, client }` or `{ ok: false, problem }`. An
address that does not resolve to loopback is refused before anything is sent, and
so is an empty token. The `sending` argument is the slice of `fetch` the client
needs, which is what lets a test supply its own.

## Reading and acting

```ts
const status = await opened.client.read("status");
if (status.ok) {
  status.value.kind; // "status"
  status.value.data; // the payload, shaped by kind
}

await opened.client.act("retry-import", { service: "sonarr" });
```

`read(endpoint, query?)` issues a `GET` to `/api/<endpoint>`, which is what the
equivalent command prints under `--json`. `act(name, body?)` issues a `POST` to
`/api/actions/<name>`. Nothing throws for an expected failure: a call returns
either a value or a `Problem` carrying a sentence written for a person to read.

## Following live state

Live updates arrive as envelopes. Anything gathered before a break in the
connection is marked out of date rather than shown as current:

```ts
for await (const arrival of follow({
  url,
  token: printedByLemonfiber,
  fetching: fetch,
})) {
  if (arrival.at === "live") draw(arrival.kind, arrival.data);
  if (arrival.at === "stale") markOutOfDate(arrival.quietForMs);
  if (arrival.at === "lost") report(arrival.problem.message);
}
```

Three arrival states rather than two, because a stream that has gone quiet is not
the same as one that has ended, and neither is the same as one carrying fresh
values. The heartbeat interval, the silence a client tolerates, the reconnection
allowance and the token header are all exported as constants — `HEARTBEAT_MS`,
`SILENCE_ALLOWED_MS`, `RECONNECTS_ALLOWED` and `TOKEN_HEADER` — so a consumer can
assert on the same numbers the client holds itself to.

## What the package exports

| Export                                                                                                                        | What it is for                                                           |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Client`, `Opened`, `Talking`, `Query`, `Sending`                                                                             | Opening a client and asking it things                                    |
| `follow`, `Arrival`, `Following`, `Fetching`                                                                                  | The event stream, and what an arrival can be                             |
| `Ledger`, `Held`                                                                                                              | The values held across a reconnection, and whether each is still current |
| `Envelope`, `Reading`, `parse`, `read`, `isKind`, `API_VERSION`                                                               | The envelope, and reading one safely                                     |
| `Kind`, `ByKind`, `CONTRACT_API_VERSION`                                                                                      | The generated kinds, and the wire version these types were generated for |
| `Problem`, `ProblemKind`, and the constructors `problem`, `refused`, `unreachable`, `malformed`, `wrongVersion`, `streamLost` | The typed error                                                          |
| `address`, `Address`                                                                                                          | The loopback rule, on its own                                            |
| `SseParser`, `SseEvent`                                                                                                       | The event-stream parser, for a consumer that needs it directly           |

## `src/generated/` is not yours to edit

Everything under `src/generated/` is written by `npm run contract:generate` from
the vendored `contract/web-api.contract.json`, which lemonfiber produces from the
Rust types that actually serialise the reply. A hand-written response shape would
be a second source of truth for the contract.

```console
npm run contract:sync       # pull a newer contract from lemonfiber
npm run contract:generate   # rewrite src/generated/ from it
```

`contract:check` regenerates and diffs, so a hand edit fails CI rather than
merging. `contract/VERSION` records the exact revision the vendored copy came
from, and the generated file names that revision and its `api_version` in its
header.

## The bar it is held to

The Rust workspace's, in its TypeScript equivalents: 100% coverage across lines,
statements, branches and functions; `strict` with `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`; `typescript-eslint` `strictTypeChecked` with zero
warnings tolerated. There are no escape hatches, and a threshold is not a target
to negotiate. `npm run ci` runs everything CI runs.

## Where to go next

The repository's own page is [sdk-ts](/develop/repos/sdk-ts/), and its
specification is [the sdk-ts spec](/spec/30-repos/sdk-ts/). The shapes it
generates are listed in [every payload kind](/api/kinds/), and the reason
`CONTRACT_API_VERSION` is not the package version is
[two version numbers](/api/two-version-numbers/).
