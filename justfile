# The gate, and the pieces of it, runnable one at a time.

default: ci

# The eleven steps `npm run ci` is, in CI's order. It is what the `gate` job
# runs, after one step that is not in it: `npm run browser` installs the Chromium
# `a11y` drives, so on a clone where that has not happened this reaches `a11y`
# and fails there.
#
# It is not the whole of CI, and these are not here:
#
#   commitlint, dco, attribution,   `.githooks/commit-msg` refuses all four before
#   the citation gate               the push; `npm ci` is what turns it on, through
#                                   npm's `prepare`
#   pins                            weekly, and deliberately not on a pull request:
#                                   a build may not reach the network, and fetching
#                                   is what that job is for
#   hygiene                         actionlint, typos, links, markdown, the invite
#                                   check and shared-files — the last needs a spec
#                                   checkout
#   workflow-pins                   asks the forge which commits a pin has not taken
#   CodeQL, gitleaks, osv-scanner,  forge-side
#   sonar, label, the reference
#   comment, the deploy
#
# The eleven steps and what each reads are tabled in README.md.
#
# Everything the `gate` job runs — not the whole of CI.
ci:
    npm run ci

# The Chromium `a11y` drives. Once per clone; `gate.yml` runs it before `ci`.
browser:
    npm run browser

# Regenerate the message catalogue and Astro's generated types.
generate:
    npm run messages
    npm run sync

format:
    npm run format

lint:
    npm run lint

types:
    npm run types

guard:
    npm run guard

arch:
    npm run arch

coverage:
    npm run coverage

build:
    npm run build

# Every address the built site carries out of itself.
links:
    npm run links

dev:
    npm run dev
