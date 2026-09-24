# AGENTS.md — website-docs.lemonfiber.app

Orientation for a focused session in this repo.

> **Common rules for every lemonfiber repo** live in the spec repo, at
> [50-governance/ai-contributors.md](https://github.com/lemonfiber/spec/blob/main/50-governance/ai-contributors.md).
> This file is the docs-site-specific header; the shared rules are canonical
> there.

## What this repo is

The documentation site, published at
[docs.lemonfiber.app](https://docs.lemonfiber.app). An Astro Starlight site with
two kinds of page: the task-shaped documentation this repository owns, under
`src/content/docs/`, and every sibling repository's own docs, rendered from a
pinned git submodule under `vendor/` and reached through a symlink. `README.md`
is the long version; the spec page for this repo is `30-repos/website-docs.md`.

## The load-bearing rule

**It renders; it does not own.** A page brought in from `vendor/` belongs to the
repository it came from, and the fix for anything wrong with it is a pull request
there. Editing the rendered copy would put two answers in the org to the same
question, with nothing to say which one a reader got — which is the whole reason
the mirrors are submodules and symlinks rather than copies. `scripts/guards.ts`
refuses a real file under a mirror route for exactly that reason.

The corollary is the thing to watch for: **a page here can go false without
anything here changing.** Every tree under `vendor/` is pinned, so a recount
stays green while the pin sits in front of the commit that moved what it counts.
`.github/workflows/pins.yml` asks the two questions that catch it — how long a
pin has been behind, and whether a pin has gone behind _on a file a guard here
reads_. Neither runs on a pull request, because a build may not reach the
network.

## Where things are

|                          |                                                                |
| ------------------------ | -------------------------------------------------------------- |
| `src/content/docs/`      | the pages this repository owns                                 |
| `src/lib/sections.ts`    | the sidebar — ten sections, plus the specification             |
| `mirrors.json`           | which upstream tree lands at which route                       |
| `src/lib/mirror*.ts`     | how a mirrored page is titled, linked and attributed           |
| `src/lib/inventories.ts` | every number this site states, and the tree it is counted from |
| `src/lib/guards.ts`      | the rules; `scripts/guards.ts` is what reads the tree          |
| `src/lib/schema.ts`      | a contract artefact read as reference tables, never copied     |
| `messages/`              | every word the chrome shows                                    |

## Numbers are derived, never written down

`inventories.ts` names, per set, the tree it is declared in, the reader that takes
the members out, and the sentence shapes the prose states the number in.
`counts.ts` derives the number on every run and compares. **No file in that chain
carries a copy of the answer** — one that did would be one more transcription to
go stale, which is the defect the chain exists to end.

Three things fail, and the third is the one to keep: a sentence whose number is
wrong, a table missing a member or holding one the source does not, and **a claim
no sentence states any more**. A rewording would otherwise leave the check
matching nothing and reporting success.

Numbers nothing here can derive are named in `README.md` as hand-held. Do not
quietly add one to that list; either find the artefact that decides it, or say in
the pull request that it is now hand-held and why.

## Prose belongs to the pages, chrome belongs to `messages/`

`src/content/**` is exempt from the no-prose-in-the-chrome rule, because on a
documentation site the prose is the product. `src/**/*.astro` is not: a word in a
template is a word no translation reaches.

## Before you push

```sh
npm ci        # also what turns this clone's git hooks on
npm run ci
```

`npm ci` runs npm's `prepare`, which sets `core.hooksPath`. That is what makes
`.githooks/commit-msg` refuse a commit CI would refuse — a non-conventional
subject, a missing sign-off, a missing `Spec:` citation, or a trailer crediting
an assistant. The four rules are in
[50-governance/contributing.md](https://github.com/lemonfiber/spec/blob/main/50-governance/contributing.md#what-a-commit-message-has-to-carry).

`npm run ci` is the whole gate and is what CI runs; `README.md` has the table of
what each step reads. `pins.yml` is the exception in both directions — it is not
in `npm run ci` and it does not run on a pull request.
