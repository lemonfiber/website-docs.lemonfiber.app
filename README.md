# website-docs.lemonfiber.app

The lemonfiber documentation site: how to install lemonfiber, run a media stack,
fix it when something is wrong, and build on it. Changing lemonfiber itself is
on [the contributor site](https://contribute.lemonfiber.app).

Published at [docs.lemonfiber.app](https://docs.lemonfiber.app).

## What it is

An [Astro Starlight](https://starlight.astro.build) site. It has two kinds of
page:

- **Pages this repository owns** — the task-shaped documentation, under
  `src/content/docs/`.
- **Pages it renders but does not own** — each sibling repository's own docs,
  brought in as a git submodule under `vendor/` and surfaced through a symlink.
  The submodule is the pin: an exact upstream revision, recorded here, with no
  second copy of the bytes.

A mirrored page's edit link points at the repository that owns it, and its
footer names the revision it was rendered from. The specification is not one of
them: it is rendered on [the frontpage](https://lemonfiber.app/spec/), and this
site pins [`lemonfiber/spec`](https://github.com/lemonfiber/spec) only to count
what the pages say about it.

## Two topics

The site is read in two topics, each with a sidebar of its own (REPO-R81):

| Topic    | For                                   | Sections                                        |
| -------- | ------------------------------------- | ----------------------------------------------- |
| Use      | an operator running lemonfiber        | Start here, running, fixing, commands, advanced |
| Build on | an integrator writing against its API | the API and the SDKs, plugins                   |

`TOPICS` in `src/lib/topics.ts` says which section sits under which topic, and
`src/lib/sections.ts` builds the two sidebars from it through
`starlight-sidebar-topics`. Every authored page names its topic in its
frontmatter, `topic: use` or `topic: build`, and the guards refuse a page that
names none, or names the topic whose sections it does not sit in. A mirrored
page takes the topic of the section its route sits in.

Contributor material is on the contributor site. The specification and project
status — the roadmap, the board, the releases — are on the
[frontpage](https://lemonfiber.app), which reads them live. Every route this site
published for any of them redirects to the page that replaced it, from
`retired.json` (REPO-R80, REPO-R53).

Every section has a landing page, and every landing page ends by pointing at the
sections next to it. Moving between "how do I do this", "why is it broken" and
"what does the API return" is the thing a reader does most, so it is the thing
the navigation is built for.

## Versions

The site is published once per kept version (REPO-R88, REPO-R89, REPO-R90):

| Path         | Built from                                                    | Built                |
| ------------ | ------------------------------------------------------------- | -------------------- |
| `/`          | `pins/stable.toml`: what the newest released version recorded | on every deploy      |
| `/next/`     | the submodule pins                                            | on every deploy      |
| `/v<minor>/` | what that version recorded, every minor from 0.16 on          | once, when it is cut |

What a release recorded is the core at the tag it was released as, each embedded
repository at the commit the version's manifest names under `pins`, and every other
repository at its default branch's last commit on or before the release day. A
repository with no commit by then, and a mirrored file its pin does not hold, are
pages that version does not have; a link to one is sent on to `/next/`.
`src/lib/stable.ts` is the rule, and `node scripts/stable.ts` writes the set
(`write`), checks it (`check`) and checks the submodules out at it (`checkout`).

`.github/workflows/versions.yml` runs after midnight UTC, once a release's day is
over and its pins can no longer move. It builds each kept version that has no
frozen build under `/v<minor>/`, keeps it as the release asset
`docs-v<minor>.zip`, and opens the pull request that moves `pins/stable.toml` to
the newest release. `deploy.yml` builds `/` and `/next/`, puts each frozen build
at its path, and writes `/versions.json`, which the version switcher in the header
reads, so a version frozen before a newer one was released still offers it.
`stable.yml` refuses a stable pin the rule does not give, and a set still
rendering an older release a day after a newer one settled.

## What it publishes for a machine

Three files are built beside the pages, from the same collection:

| File               | What it holds                                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/provenance.json` | Every route, against the repository, path and revision it was rendered from (REPO-R83): a mirrored page's owner at its pin, an authored page this repository at the build's commit |
| `/llms.txt`        | Every page by topic, with what its frontmatter says of it                                                                                                                          |
| `/llms-full.txt`   | Every page in full                                                                                                                                                                 |

The endpoints are `src/pages/`, the shapes are the kit's `provenance` and
`llms`, and `src/lib/published.ts` orders the pages by topic.

## Running it

```sh
npm ci
npm run messages   # compile the message catalogue
npm run dev
```

`npm ci` is also what turns on this repository's pre-push hook, which refuses a
push that would leave a branch carrying no commit `origin/main` does not — what
pushing the trunk over a feature branch looks like. npm's `prepare` script does
it, so `npm install` serves too. A clone nobody has installed into has no hook:
it is `git config core.hooksPath .githooks`, per clone, and git cannot read
`.githooks/` on its own.

`npm run ci` is the whole gate, and it is what CI runs — after one step that is
not in it. `gate.yml` runs `npm run browser` first, which installs the Chromium
the accessibility sweep drives, so on a clone where that has not happened
`npm run ci` reaches `a11y` and fails there. Run it once:

```sh
npm run browser
```

Everything else in the chain needs nothing CI has that a clone does not:

| Step           | What it checks                                                |
| -------------- | ------------------------------------------------------------- |
| `messages`     | The message catalogue compiles                                |
| `sync`         | Astro's generated types are current                           |
| `format:check` | Prettier, with the Astro plugin registered explicitly         |
| `lint`         | ESLint, zero errors and zero warnings, including `scripts/`   |
| `types`        | `astro check`, failing on errors, warnings **and** hints      |
| `guard`        | The structural guards below                                   |
| `arch`         | dependency-cruiser                                            |
| `coverage`     | Vitest, 100% across statements, branches, functions and lines |
| `build`        | The site builds, links validate, Pagefind indexes             |
| `links`        | Every address the built site sends a reader away to           |
| `a11y`         | axe over the built site, both themes, WCAG 2.1 AA             |

### On the type gate

Starlight ships raw `.ts` rather than compiled JavaScript with declarations, and
its `exports` point at `./index.ts`. A bare `tsc --noEmit` therefore type-checks
Starlight's own source, where `skipLibCheck` does not reach: on this
configuration that is 17 errors inside `node_modules` and none in this
repository. `astro check` scopes diagnostics to project files, so it reports
those same authored files with the same strict settings and none of the noise.
It is run at `--minimumFailingSeverity hint`, which is stricter than the default.

The `tsconfig.json` extends `astro/tsconfigs/strictest` and adds
`noPropertyAccessFromIndexSignature` and `useUnknownInCatchVariables`.

### On the coverage figure

The 100% threshold covers **the TypeScript this repository authors** — the guard
rules, and the loaders, plugins and components as they are added. It is scoped
by `vitest.config.ts` and explicitly excludes:

- `src/content/**` — prose, not code.
- `src/paraglide/**` — generated by Paraglide.
- `src/lib/sections.ts` — a declaration of the sidebar, evaluated by Astro at
  config load rather than under test.

It is a statement about authored code, not a claim that every rendered page is
tested.

## The guards

The rules every lemonfiber site keeps are
[`lemonfiber/website-kit`](https://github.com/lemonfiber/website-kit)'s, stated
and tested there; `scripts/guards.ts` runs them over this tree and adds this
site's own, from `src/lib/`. Together they enforce:

- No external origin outside a comment. Nothing is loaded from a third party.
- No lint suppression, and no TypeScript escape hatch.
- Comments state facts. Reasoning belongs in an ADR.
- 550 lines per file.
- No prose in the chrome — every word the chrome shows comes from `messages/`.
  This is scoped to `src/**/*.astro`; `src/content/**` is exempt, because on a
  documentation site the prose is the product.
- **A lockfile that resolves the revision its declaration names.** The one
  dependency pinned by commit is the brand package. `npm ci` re-resolves a git
  dependency rather than refusing a lockfile that names a different commit, so
  the two are read here and compared.
- **No real file under a mirror.** A mirrored route must be a symlink into
  `vendor/`, never a copy.
- **No owned page whose slug collides with a mirrored path.** One home per fact.
- **The tap's formula, against what a page says installing it gets you.**
  `brew install lemonfiber/tap/<name>` loads `Formula/<name>.rb` from the tap,
  and what that file declares is the whole of what the command installs. The
  names are compared in both directions, and the version a page states is read
  out of the formula rather than kept by hand — the release pipeline rewrites
  that file at 1.0.0, and the sentence calling it a placeholder goes false in
  the commit that does it.
- **The stylesheet against the brand tokens it renames.** `src/app.css` defines
  no colour, radius or step of its own. A name it reads that brand does not
  declare falls back to the inherited value rather than failing, so the page
  renders in the wrong colours and nothing says so. Brand arrives here twice —
  the submodule the brand pages are rendered from, and the npm package the
  stylesheet imports — and the two are compared with each other as well, which
  is the disagreement the lockfile rule cannot see.
- **Every authored page names its topic**, and the topic is the one its section
  sits under.

The mirrors are declared in `mirrors.json`, which is what the mirror rules
check against. A tree mirror's own root route is the one place an owned page may
sit beside a mirror: it is the section landing page, and nothing upstream
renders there.

### Counts, against what is counted

This site's pages state numbers about the trees under `vendor/`: the twenty-two
services and the seventy-three payload kinds among them. Each one is a
transcription of something machine-readable, and goes false when a pin moves.

`src/lib/inventories.ts` names, for each such set, the tree it is declared in,
which reader takes the members out of it, and the sentence shapes the prose
states the number in. `src/lib/sources.ts` is the readers — one per shape a
source declares its members in, knowing nothing of which sets there are.
`src/lib/counts.ts` derives the number on every run and compares. **No number is
written down in any of them** — a check that carried its own copy of the answer
would be one more transcription to go stale.

The paragraph above is inside that check. This README states the site's numbers
in the site's own sentence shapes, so it is read as one more page rather than as
documentation about them — the count of payload kinds in it had been left behind
by the contract, and nothing here was looking.

Where a page sets the members out in a table rather than only counting them, the
table is compared against the source in both directions, as the error-code pages
are. Three failures are reported, not one:

- a sentence whose number is not the number the source has;
- a table with a member the source does not have, or without one it does;
- **a claim no sentence states any more.** A rewording would otherwise leave a
  check matching nothing and reporting success, which is the unchecked number it
  replaced.

Some numbers on this site are not derivable from anything vendored and are not
checked: the four codes raised as `critical` and the code-to-exit-code mapping
on `fixing/every-error-by-code`, because no artefact says which severity or
which exit any one code carries. Those stay hand-held.

### When a source moves under its guard

A guard is only as true as the tree it reads, and every tree under `vendor/` is
pinned. A recount stays green while the pin sits in front of the commit that
changed what it counts: `api/the-envelope` named six read endpoints, and the
listing guard agreed with it in both directions, against a contract upstream had
already grown.

Two workflows keep the pins moving and say when they stop.

`.github/workflows/bump-pins.yml` runs every three hours. For each repository
whose default branch is ahead of its pin, it checks the new revision out and
runs `npm run guard -- --fix` to rewrite the counts the pages state. A move the
guards then hold is taken; a move that needs words written here is left at its
pin and named, with what the guards said, so it holds back no other. What is
taken goes to `pins/all` as one commit made through the API, and the pull
request it opens merges itself once every required check passes. A package
taken by commit moves in the same pull request: one from a repository pinned
under `vendor/` follows that pin, so `@lemonfiber/brand` and `vendor/brand` stay
one revision, and `@lemonfiber/website-kit` follows its default branch.
`node scripts/bump.ts` is the whole of that job.

`.github/workflows/pins.yml` holds `pins-sources`, the gate. Has a pin gone
behind on a file a page here renders or a guard reads? The paths are the
declarations themselves — every mirror in `mirrors.json`, every inventory's
`source`, and the artefact each guard that is not one holds a page to — so a
new one is watched from the day it is declared and nothing is written down
twice. It names the commits rather than counting them, and refuses once one has
waited longer than `WINDOW_HOURS` (the kit's `src/pins.ts`) on its branch: on
every pull request, and on a daily schedule that tells the maintainers' Discord. A pull request that moves
a pin is judged on the modules it moves. `node scripts/pins.ts` is the whole of
that job, and runs here as it runs there.

`age`, on the same schedule, reports how long each pin has been behind at all,
in days, and gates nothing.

## Pages built from an artefact

Some reference is neither prose nor a mirror: it is a contract artefact the
binary generates, set out as tables. `src/lib/schema.ts` reads a JSON Schema's
definitions into fields, types and choices, and `src/lib/plugins.ts` reads the
two lists a plugin is written against. The components that render them read the
checkout through `src/lib/schema-source.ts`, so the page is the artefact at the
pinned revision and there is no transcription of it to go stale.

| Page                              | Rendered from                          |
| --------------------------------- | -------------------------------------- |
| `api/reference`                   | `contract/web-api/`                    |
| `plugins/the-manifest`            | `contract/plugin-manifest.schema.json` |
| `plugins/extension-points`        | `contract/extension-points.json`       |
| `plugins/capabilities-and-wiring` | `contract/capability-vocabulary.json`  |

The core keeps the web-API contract as a directory: an index, one file per kind,
one file per shared definition under `defs/`, and the reads, the refusals and
the key-callable actions beside them, joined by relative `$ref`s.
`src/lib/contract.ts` puts it back together as one document in which every kind
carries the definitions it reaches under its own `$defs`, which is what the
guards and the reference page read. The definitions are then merged by name,
and a name defined two different ways fails the build rather than publishing
either shape.

## How a mirrored page is built

The kit's `mirror` module holds the rules as pure functions, `mirror-source` is
the three calls that touch git and the filesystem, and `mirror-loader` wires
them into the content collection, which `src/content.config.ts` declares. For each page it:

- takes the title from frontmatter, else the first heading, else what
  `mirrors.json` declares — and fails the build if a page names itself nowhere;
- drops that first heading, because Starlight renders the title itself;
- rewrites every relative link: to another page this site renders, it becomes
  that page's route; to anything else it becomes the file's address upstream at
  the pinned revision, so it resolves to the bytes that were rendered;
- rewrites a link written as an upstream file address the same way, so one
  repository's prose lands on this site rather than leaving it;
- records the revision and its date, an edit link into the owning repository,
  and the exact blob the page came from.

Routes are lower case, and a `README` is the index of the directory holding it.

## The links that leave

Starlight's validator resolves a link that stays on this site against the route
table, and the build fails on one that does not resolve. It says nothing about a
link that leaves — and on a mirrored page most links do, because a relative link
in another repository's prose is rewritten to that repository's file at the
pinned revision. That address is a claim about bytes already in the checkout, so
it can be checked without a network.

`scripts/links.ts` reads `dist/` after the build and applies the rules in
the kit's `links` module to every address that points into a repository this build
rendered from:

- **The path exists.** `git ls-tree` at the pinned revision answers, so an
  address into a file that is not there fails the gate. This is what a link
  resolved against a file rather than against the directory holding it looks
  like: `blob/<sha>/README.md/AGENTS.md`, a path no revision has ever held.
- **The revision is this build's.** An address stamped with any other revision
  is one this build cannot vouch for.
- **No rewritten address inside a code example.** An example showing
  `../AGENTS.md` teaches a relative link; rewritten, it shows a hundred-character
  absolute URL and no longer demonstrates what it was written for. A pinned
  revision inside a `<pre>` is how one is recognised, since that revision is
  something only this build knows.

It opens no socket, so it is fast, offline and deterministic, and it runs on
every pull request as part of `npm run ci`.

What it cannot see is the world: a repository made private, a page retired, a
host that stopped answering. That is the `links` workflow, which builds the site
and runs lychee over `dist/` on a schedule, configured by `lychee-site.toml`.
It is not a pull-request gate — the built site carries well over a thousand
outward addresses, most of them at one forge, and a per-PR run of that would be
slow, rate-limited, and red for reasons the branch did not cause.

## What it consumes

| Package                   | Why                                                         |
| ------------------------- | ----------------------------------------------------------- |
| `@lemonfiber/brand`       | Colour, type, spacing and radii, pinned by commit           |
| `@lemonfiber/website-kit` | The mirroring, guards and checks every site runs, by commit |

`src/app.css` imports the brand tokens and re-aliases them into product-local
names. Components use those names; they never reference a `--lf-*` token or a
hex value directly — and neither does `app.css`, which contains no colour of its
own in either theme. Brand owns the values, so a change there reaches this site
and a gap there stays visible rather than being masked by a local literal.

Brand's dark theme is `[data-lf-theme="ink"]` and Starlight's is
`[data-theme="dark"]`. `astro.config.ts` mirrors the second onto the first.

The accessibility sweep is what keeps that honest. `npm run a11y` serves what
`npm run build` last wrote to `dist/` — it does not build, and run on its own
against a stale or absent `dist/` it sweeps that instead — and runs axe over the
routes named in `a11y/contrast.spec.ts`, in both themes, at WCAG 2.1 AA. In
`npm run ci` the build immediately precedes it, which is what makes the site it
serves the one this run produced.

Those routes are one of each kind the site serves rather than all of them: the
landing page, an authored page, a section landing page, mirrored pages from two
different repositories, and a long reference table. Adding a kind of page means adding a route to that list; adding
a page of a kind already there does not.

## Licence

See [LICENSE](LICENSE).
