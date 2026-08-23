# The gate, and the pieces of it, runnable one at a time.

default: ci

# Everything CI runs, in CI's order.
ci:
    npm run ci

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

dev:
    npm run dev
