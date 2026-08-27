---
title: The PHP SDK
description: The PHP client for lemonfiber's local API — one class per kind, a loopback-only transport, and a stream that never presents stale values as current.
sidebar:
  order: 4
---

`lemonfiber/sdk-php` is the PHP client for lemonfiber's local HTTP API. It is a
peer of [the TypeScript SDK](/api/typescript-sdk/): both implement the same
specification, and neither defines it. Where this client disagrees with
[the contract](/spec/20-architecture/contracts/web-api/), this client is wrong.

**Not yet published.** Nothing consumes it, so it stays unreleased until there is
a stable major worth pinning; registration on Packagist happens then rather than
now. The surface it talks to is `lemonfiber ui` — one read endpoint for each
question a command answers, `POST /api/actions/<name>` and `GET /api/events`, on
a loopback socket behind a token minted for that run.
[The envelope](/api/the-envelope/) sets the endpoints out one by one.

## Install

```sh
composer require lemonfiber/sdk-php
```

Requires PHP 8.5. The only runtime dependency is Saloon 4, plus the PSR-7
interfaces it already brings.

## Reading and acting

lemonfiber prints a token each time it starts. Pass it in; the client sends it as
a header and never puts it in an address.

```php
use Lemonfiber\Sdk\Client;
use Lemonfiber\Sdk\Time\Duration;

$client = Client::onPort(9000, $tokenLemonfiberPrinted);

$status = $client->read('/api/status');
$status->kind;        // 'status'
$status->data;        // the payload, shaped by kind

$client->act('/api/actions/restart', ['forms' => ['tv'], 'services' => ['sonarr']]);
```

An action's name and its arguments are the command line's own. A name this
surface does not offer is refused rather than invented, and a field no action
takes is refused rather than ignored.

## One class per kind

What an envelope holds is shaped by its `kind`, so it is reached through the kind
rather than as an open value. There is one generated class per kind, and it is
the way through:

```php
use Lemonfiber\Sdk\Generated\Kind;
use Lemonfiber\Sdk\Generated\LogEnvelope;

$envelope = $client->read('/api/logs');   // Envelope<mixed>

if ($envelope->kind === Kind::Log->value) {
    $log = LogEnvelope::in($envelope);    // Envelope<the shape the contract gives `log`>

    $log->data;   // typed by that shape, and checked by static analysis
}
```

`LogEnvelope::in()` refuses an envelope carrying any other kind rather than
handing back a payload of the wrong shape. The kinds themselves are listed in
[every payload kind](/api/kinds/).

## Following live state

Live updates arrive as envelopes. Anything gathered before a break in the
connection is marked out of date rather than shown as current:

```php
$feed = $client->events(heartbeat: Duration::ofSeconds(15));

foreach ($feed->follow() as $envelope) {
    $held = $feed->held()->get('status');

    $held?->isStale();   // true once the connection has broken and been reopened
}
```

## Where the contract comes from

Shapes are generated. `src/Generated/` holds types produced from
`web-api.contract.json`, the artefact lemonfiber builds from the types it
serialises with. Nothing in that directory is edited by hand.

| File                 | What it holds                                                                      |
| -------------------- | ---------------------------------------------------------------------------------- |
| `Contract.php`       | The `api_version` these types were generated from, and the revision they came from |
| `Kind.php`           | Every kind the contract describes                                                  |
| `<Kind>Envelope.php` | One class per kind: the kind it reads, and the payload type the contract gives it  |

A copy of the artefact is vendored beside the revision it came from, so
generation needs no network and a contract change arrives as a diff somebody
reads. Three commands, and only the first touches the network:

| Command                            | Network | What it does                                                                                                                                                     |
| ---------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `composer contract:sync -- v1.0.0` | yes     | Fetches the artefact at that revision — a release tag or a full commit hash — checks it is one, and vendors it into `contract/` beside the revision it came from |
| `composer contract:generate`       | no      | Writes `src/Generated/` from the vendored copy. Deterministic; its output is committed                                                                           |
| `composer contract:check`          | no      | Regenerates and fails on any diff, so CI fails on a stale `src/Generated`                                                                                        |

Generation refuses an artefact whose `api_version` this package does not
implement, naming both versions and writing nothing. `Contract::API_VERSION`
comes from the artefact and `Api::VERSION` comes from that, so the wire version
is stated once rather than repeated by hand.

## What is written by hand

Everything else in `src/` is behaviour no schema expresses.

| Written by hand           | What it holds to                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Http\RunToken`           | The per-run token travels in a header, never in an address                                                                                             |
| `Http\BaseUrl`            | Loopback only; any other host is refused before anything is sent, and a loopback address is not refused for being named rather than numeric            |
| `Envelope\EnvelopeReader` | A version mismatch is refused plainly, naming both versions, rather than rendering part of an answer                                                   |
| `Envelope\Payload`        | An envelope is read as the kind it carries, or not at all                                                                                              |
| `Events\EventStream`      | A stream quiet for twice the agreed heartbeat is reported as broken, not as calm; one missed beat is not                                               |
| `Events\HeldValues`       | Values gathered before a reconnection gap are marked out of date                                                                                       |
| `Exception\RequestFailed` | A refusal carries the sentence lemonfiber answered with, read back through `said()`; an answer carrying none names the endpoint and the status instead |
| `Exception\*`             | The error model, in plain language                                                                                                                     |

## The bar it is held to

Every gate is a merge gate. `composer ci` runs all but one of them: Pint with the
`per` preset and strict rules on top, PHPStan at level max with 100% type
coverage, a Rector dry run with zero changes, the repository's own guards,
dependency checks, contract regeneration with no diff, 100% line coverage and a
100% mutation score.

The one it leaves out is the backward-compatibility check, which runs against the
newest `v*` tag. That is `composer bc`, a script of its own and a CI job of its
own, and it needs a checker installed separately with `composer bin bc install`.
There are no tags yet, so the job skips both its steps and passes having compared
nothing — it says as much rather than reporting a success it did not earn.

There is no PHPStan baseline and no ignored errors. `@phpstan-ignore`,
`@codeCoverageIgnore`, `@SuppressWarnings` and their relatives are rejected by a
guard that reads comments through PHP's own tokeniser. `src/Generated/` is
skipped by the linters and the test gates: generated code is proved by
regeneration producing no diff, not by passing a linter, and everything that uses
it is analysed as usual.

## Where to go next

The repository's own page is [sdk-php](/develop/repos/sdk-php/), and its
specification is [the sdk-php spec](/spec/30-repos/sdk-php/). For the wrapper
these classes read, see [the envelope](/api/the-envelope/); for why
`Contract::API_VERSION` is not the package version, see
[two version numbers](/api/two-version-numbers/).
