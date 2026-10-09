/**
 * Which pins a build renders, and what a page does with an artefact those pins
 * do not carry.
 *
 * `next` renders the submodule pins; the newest stable and each kept version
 * render the pins a release recorded (REPO-R88), named by `DOCS_PINS`. The
 * pages are today's either way, so a page can read an artefact that arrived
 * after the release it is built for. In a release's build that part of the
 * page sends the reader to the same page on `next`, where the artefact is, as
 * a link to a page the release does not have already does. In `next` a
 * missing artefact is a fault, and the build fails on it.
 */
import { routeIn } from "./versions.ts";

/** Whether this build renders the pins a release recorded. */
export const fromRelease = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean => env["DOCS_PINS"] !== undefined;

/**
 * `value`, or null where it is missing from a release's build; a missing value
 * in `next` throws `fault`.
 */
export function present<T>(
  value: T | null,
  fault: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): T | null {
  if (value !== null || fromRelease(env)) return value;
  throw new Error(fault);
}

/** The same page on `next`, from a page's path and the base it is built at. */
export const onNext = (pathname: string, base: string): string =>
  `/next${routeIn(pathname, base)}`;
