---
title: The repository map
description: The eleven repositories in the lemonfiber org, what each one is for, and how they depend on each other.
sidebar: { order: 1 }
---

lemonfiber is eleven repositories. The split is not a taste; each one exists
because something about it — a toolchain, a release cadence, a licence, or a
requirement Homebrew imposes — could not live inside another.

This page is the orientation. Each repository's own specification is linked from
its row, and its own README is rendered on this site under
[the repository pages](/develop/repos/lemonfiber/).

## The eleven

| Repository                                                         | Language   | What it is                                                               |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| [`spec`](/spec/)                                                   | Markdown   | The specification. Canonical, and cited by every change to the rest      |
| [`lemonfiber`](/spec/30-repos/lemonfiber/)                         | Rust       | The binary: the command line, the terminal interface and the web API     |
| [`lemonfiber-web`](/spec/30-repos/lemonfiber-web/)                 | TypeScript | The web surface — a static app that draws the API and implements nothing |
| [`sdk-ts`](/spec/30-repos/sdk-ts/)                                 | TypeScript | The TypeScript client for the web API, and all the web surface uses      |
| [`sdk-php`](/spec/30-repos/sdk-php/)                               | PHP        | The same contract in PHP, as a peer rather than a translation            |
| [`lemonfiber-media-stack`](/spec/30-repos/lemonfiber-media-stack/) | YAML/TOML  | The Compose definitions, profiles, manifest and service configs          |
| [`homebrew-tap`](/spec/30-repos/homebrew-tap/)                     | Ruby       | The generated formula, so `brew` works                                   |
| [`brand`](/spec/30-repos/brand/)                                   | CSS/SVG    | Design tokens and the marks                                              |
| [`website-lemonfiber.app`](/spec/30-repos/website-lemonfiber/)     | Astro      | The public frontpage                                                     |
| [`website-docs.lemonfiber.app`](/spec/30-repos/website-docs/)      | Astro      | This site                                                                |
| `.github`                                                          | Markdown   | The org-wide community health files; it has no specification of its own  |

The `.github` repository is the one without a page, because it has nothing
specific to say: it carries the code of conduct, the security policy, the issue
templates and the org profile that GitHub serves for any sibling repository not
defining its own. That is why those files are inherited rather than copied
eleven times.

## How they depend on each other

Five relationships carry all the weight.

**`lemonfiber` embeds `lemonfiber-media-stack`** as a pinned submodule, and
validates the manifest's schema version at build time. The two version
independently; the pin is what says exactly which stack a given binary shipped.

**`lemonfiber` generates `homebrew-tap`.** The formula is written by the release
pipeline and never by hand. That publish job is off until 1.0.0, when the tap has
a token to be written with, so every release so far has left the formula as the
placeholder it started as. The tap is downstream of everything and inert
otherwise.

**`lemonfiber` generates the SDKs' contract.** One artefact is emitted from the
types that actually serialise the reply; `sdk-ts` and `sdk-php` generate their
types from it and hand-write only behaviour. Neither SDK is the reference for
the other — both answer to the contract.

**`lemonfiber-web` consumes `sdk-ts` and `brand`**, and is itself embedded into
the binary as a pinned submodule at build time.

**Nine repositories feed this site** — every one but the two websites, which
render rather than being rendered. Each one's own documentation arrives as a
git submodule pinned to an exact revision and is rendered rather than copied.
Nothing is fetched during a build. The specification arrives the same way and is
rendered here, at [`/spec/`](/spec/) — it is the largest body of prose the org has,
and a reader searching the documentation for a requirement should find it rather
than be sent to another domain. It is authored in `spec` and published only here
([ADR-0015](/spec/00-overview/decisions/0015-docs-site-renders-what-it-does-not-own/),
`REPO-R52`).

And running underneath all of it: **no change lands in any of them without
citing the specification.**

## The one property to remember

Each repository has a single load-bearing property. If you remember nothing else
about it, remember this one, because most mistakes are a violation of it.

| Repository                    | The property                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `lemonfiber`                  | **Logic cannot render.** The core crate has no UI dependency, so a surface can never grow behaviour of its own                          |
| `lemonfiber-media-stack`      | **It runs without lemonfiber.** Plain `docker compose` works, which is what makes adopting the tool reversible                          |
| `lemonfiber-web`              | **It draws the API and implements nothing.** An app whose only capability is to ask the core and show the answer cannot diverge from it |
| `sdk-ts` and `sdk-php`        | **The specification is the reference.** An SDK that disagrees with the contract is wrong                                                |
| `homebrew-tap`                | **Nobody writes it.** It is generated, and exists only because Homebrew requires a repository of that name                              |
| `brand`                       | **The tokens are generated; the marks are not open.** Pull assets from here rather than redrawing them                                  |
| `website-lemonfiber.app`      | **The org is the motor.** Roadmap and status are read from the org at build time, never hand-authored                                   |
| `website-docs.lemonfiber.app` | **It renders; it does not own.** Every page is another repository's file at a revision this site names                                  |

## Which one is yours

If you are fixing a defect, it belongs to the repository whose behaviour is
wrong. If you are proposing new behaviour, it belongs to `spec` first. If you
cannot tell, [file it anywhere](/contributing/where-does-my-issue-go/).

## Related

- [Per-repo specifications](/spec/30-repos/) — the normative source for this page
- [The gates](/develop/the-gates/) — the checks every one of them runs
- [Architecture](/develop/architecture/) — how the Rust workspace is built inside
- [The stack manifest](/advanced/the-stack-manifest/) — the contract between the binary and the stack
