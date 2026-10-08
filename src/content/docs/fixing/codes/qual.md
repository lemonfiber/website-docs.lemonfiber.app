---
title: QUAL — quality against what is available
topic: use
description: Every QUAL code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised where the chosen quality preset and the world disagree. See [quality presets](/running/quality-presets/).

| Code     | What it means                                                                                                                                                                                                          | What to do                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `QUAL-1` | The free space is thin for the chosen preset — it holds only a few hours of content at that quality. Nothing is broken and nothing already downloaded is affected; new acquisitions will simply fill the disk quickly. | Free space, move the data location to a larger volume, or choose a lighter preset for the media that does not need it. |
| `QUAL-2` | Releases exist for wanted content and the chosen preset wants none of them. The indexer is working; the preset is stricter than what can be found.                                                                     | Choose a less demanding preset for that media, or wait for a matching release. The content stays wanted either way.    |
| `QUAL-3` | A clean search turned up nothing at all for wanted content. The indexer answered — this is not an indexer failure — there is simply nothing to grab yet.                                                               | Check the indexer carries this content, or wait. No action is needed if it is merely not out yet.                      |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
