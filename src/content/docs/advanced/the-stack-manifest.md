---
title: The stack manifest
description: stack.toml is everything lemonfiber knows about the services — profiles, forms, service declarations, and what validation refuses.
sidebar:
  order: 1
---

`stack.toml` sits at the root of a stack directory, beside `compose.yml`.
Everything lemonfiber knows about the stack comes from it. It knows nothing about
Sonarr that is not declared there, which is what makes adding a service a data
change rather than a release.

The alternative would be a list of service names inside the binary. That would
make every stack change a release, make a stack of your own impossible, and
quietly stop "it is just Compose" from being true.

## The top level

```toml
schema_version  = 1
stack_version   = "1.0.0"
min_cli_version = "0.4.0"
```

| Field             | Type    | What it says                                                    |
| ----------------- | ------- | --------------------------------------------------------------- |
| `schema_version`  | integer | Which generation of the manifest **format** this is             |
| `stack_version`   | semver  | The **content** version: it moves when services or forms change |
| `min_cli_version` | semver  | The oldest binary this stack will let operate it                |

A binary refuses a `schema_version` it does not implement, naming both versions,
and refuses a stack demanding a newer binary, naming the version required. Those
are three distinct refusals with three distinct messages — collapsing them into
"invalid manifest" would leave you guessing which of three unrelated problems you
have. See [two version numbers](/api/two-version-numbers/).

## `[[profile]]`

A profile is a service's role. It maps one-to-one onto a Compose profile name.

| Field         | Type   | Required | Notes                                                                                          |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------------------------- |
| `id`          | string | yes      | Unique, and matches a Compose profile name exactly                                             |
| `name`        | string | yes      | Human-facing                                                                                   |
| `description` | string | yes      | Shown in form previews                                                                         |
| `protocol`    | enum   | no       | `usenet` or `torrent`. Present only on a profile that cannot run without a configured provider |

`protocol` is what lets a form's closure be narrowed to the protocols you have
actually configured, without lemonfiber knowing the strings `usenet` and
`torrent` in code. A profile declaring one cannot run unless that provider is
configured; a profile declaring none is never narrowed away. Getting this wrong
is not cosmetic: a torrent profile started without a configured VPN brings up the
tunnel container with no credentials.

## `[[form]]`

A form is a named set of profiles — the thing you name when you start something.

| Field         | Type    | Required | Notes                                                      |
| ------------- | ------- | -------- | ---------------------------------------------------------- |
| `id`          | string  | yes      | Unique                                                     |
| `name`        | string  | yes      | Human-facing                                               |
| `description` | string  | yes      | One line, plain language                                   |
| `profiles`    | array   | yes      | The closure. Every entry must reference a declared profile |
| `composable`  | boolean | no       | Defaults to true. May be combined with other forms         |

A form's `profiles` list is the **complete** closure, written out. Dependencies
are not inferred: the `tv` form names `search` explicitly rather than lemonfiber
deducing that Sonarr needs indexers. The verbosity is deliberate — inference would
require lemonfiber to understand each service's semantics, which is exactly the
coupling this file exists to avoid. What forms are for, from the operator's side,
is [forms and slices](/running/forms-and-slices/).

## `[[service]]`

| Field          | Type    | Required       | Notes                                                                        |
| -------------- | ------- | -------------- | ---------------------------------------------------------------------------- |
| `id`           | string  | yes            | Unique, and matches the Compose service name                                 |
| `name`         | string  | yes            | Human-facing                                                                 |
| `profile`      | string  | yes            | **Exactly one**, referencing a declared profile                              |
| `image`        | string  | yes            | Without the tag                                                              |
| `tag`          | string  | yes            | Explicit. A floating tag fails validation                                    |
| `port`         | integer | no             | Primary interface or API port. Omitted for a service with no listener        |
| `bind`         | enum    | yes, if `port` | `loopback` or `lan`                                                          |
| `health`       | table   | no             | Absent means lifecycle waits on container state only                         |
| `api`          | table   | no             | How lemonfiber talks to it for wiring. Absent means no API integration       |
| `criticality`  | enum    | yes            | `critical`, `core`, `important`, `enhancing` or `optional`                   |
| `license`      | string  | yes            | An SPDX identifier. A non-OSI value fails validation                         |
| `upstream`     | string  | yes            | Project URL, for maintenance review                                          |
| `last_release` | string  | yes            | `YYYY-MM-DD`, and the **latest upstream** release rather than the pinned one |
| `describes`    | string  | yes            | What it does for the operator                                                |
| `without_it`   | string  | yes            | The consequence of its absence                                               |
| `media_types`  | array   | no             | Which media types it handles; drives root-folder seeding                     |
| `depends_on`   | array   | no             | **Same profile only**                                                        |
| `capabilities` | array   | no             | Anything beyond an allow-list fails validation                               |
| `host_managed` | boolean | no             | True where the lifecycle is the operating system's rather than the engine's  |

`describes` and `without_it` are what turn an inventory into a judgement about
severity. `last_release` is an abandonment signal: a project that has released
six times since your pin is alive, and one that has released nothing since is the
case worth noticing.

### `health`

```toml
health = { kind = "http", path = "/ping", timeout_s = 60 }
health = { kind = "tcp", timeout_s = 30 }
health = { kind = "container" }
```

`kind = "http"` is checked against `port` and `path`. Startup is health-gated
rather than process-gated, so this is what "started" actually means.

### `api`

`kind` selects which client implementation talks to the service, and
`key_source` says where the credential comes from.

| `key_source`                              | Meaning                                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `config-xml`, `config-ini`, `config-json` | The service mints it and writes it to `path`; lemonfiber reads it                                                             |
| `api-settings`                            | Retrieved over the service's own API once authenticated                                                                       |
| `generated`                               | The service offers nothing durable to read, so lemonfiber generates the credential, sets it, and records it for its consumers |
| `none`                                    | The API needs no credential at all                                                                                            |

`version` is the major version of the service's HTTP API. It is required for the
`servarr` kind and read there, because that one shape spans two versions, so it
is data the manifest carries rather than a guess the client makes from a service's
name.

## What validation refuses

Validation reports **every** violation in one pass, each naming its location.
Reporting one error per run turns fixing a fork into a guessing game.

| Rule                                                      | What the failure names         |
| --------------------------------------------------------- | ------------------------------ |
| `schema_version` is supported                             | Both versions                  |
| Every `id` is unique within its kind                      | The duplicate                  |
| Every `service.profile` references a declared profile     | Both                           |
| Every `form.profiles` entry references a declared profile | Both                           |
| Exactly one profile per service                           | The service                    |
| No `depends_on` crossing a profile boundary               | The service and the target     |
| `tag` is not floating                                     | The service                    |
| `bind` is present when `port` is                          | The service                    |
| `license` is a recognised OSI identifier                  | The service and the licence    |
| `last_release` is `YYYY-MM-DD` and not in the future      | The service and the value      |
| `capabilities` are within the allow-list                  | The service and the capability |
| `protocol` is a permitted value                           | The profile and the value      |
| At most one profile per `protocol`                        | Both profiles                  |
| Manifest services match `compose.yml` services exactly    | The divergence, both ways      |

That last rule matters more than it looks: a manifest describing a service that
is not in the compose file, or the reverse, is the most likely error when adding
one, and it fails in confusing ways at runtime.

## Where the manifest lives

The bundled stack is embedded in the binary, and the build refuses to produce a
binary whose embedded manifest it cannot read — so the common pairing is checked
at compile time rather than reaching you. Your own directory is
`--stack-dir <PATH>`, and it is validated at load instead.

## Where to go next

[Adding a service](/advanced/adding-a-service/) is the same file from the other
end. [Running without lemonfiber](/advanced/without-lemonfiber/) is the compose
project underneath it, and
[the manifest contract](/spec/20-architecture/contracts/stack-manifest/) is the
normative version of this page.
