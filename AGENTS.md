# AGENTS.md — website-docs.lemonfiber.app

> **Start at the roadmap and board on [lemonfiber.app](https://lemonfiber.app),
> rendered from the report of where every unreleased version stands. Then the
> rules** every repository shares:
> [working in the repositories](https://github.com/lemonfiber/spec/blob/main/50-governance/working-in-the-repositories.md)
> and [the rules for agents](https://github.com/lemonfiber/spec/blob/main/50-governance/ai-contributors.md).
> This file holds only what is true of this repository.

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
`.github/workflows/bump-pins.yml` takes every pin that has moved in one pull
request, `pins/all`, rewriting the counts the pages state on the way, and that
pull request merges itself when the guards hold. A move that needs words the
fixer cannot write is left at its pin and named in it, with what the guards
said.
`pins-sources` in `.github/workflows/pins.yml` refuses every pull request once
a commit touching a file a page here renders has waited longer than its window
untaken — the cure is to take the pin and write what the guards name.

## Where things are

|                           |                                                                  |
| ------------------------- | ---------------------------------------------------------------- |
| `src/content/docs/`       | the pages this repository owns                                   |
| `src/lib/topics.ts`       | the two topics, Use and Build on, and the sections under each    |
| `src/lib/sections.ts`     | the two sidebars, one per topic                                  |
| `mirrors.json`            | which upstream tree lands at which route                         |
| `@lemonfiber/website-kit` | mirroring, the shared guards, the link and pin checks, by commit |
| `src/lib/inventories.ts`  | every number this site states, and the tree it is counted from   |
| `scripts/guards.ts`       | the kit's guards, plus this site's own rules from `src/lib/`     |
| `src/lib/schema.ts`       | a contract artefact read as reference tables, never copied       |
| `messages/`               | every word the chrome shows                                      |
| `src/pages/`              | `provenance.json`, `llms.txt` and `llms-full.txt`                |

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

`npm ci` runs npm's `prepare`, which turns this clone's git hooks on.

`npm run ci` is the whole gate and is what CI runs; `README.md` has the table of
what each step reads. `pins-sources` is the exception: it runs on every pull
request and is not in `npm run ci`, because it fetches the repositories this
site pins and a build may not reach the network.
