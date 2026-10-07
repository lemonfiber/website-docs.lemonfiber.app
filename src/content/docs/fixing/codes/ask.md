---
title: ASK — putting a request to the web surface
description: Every ASK code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by the web API `lemonfiber ui` serves, where a request to act, to hear about a job, to move setup or to mint a key could not be answered as it was asked, or reached a path or a method no endpoint answers. Nothing was changed by any of them. `ASK-1`, `ASK-7` and `ASK-9` answer `404`, `ASK-10` answers `405`, and every other one `400`. See [the envelope](/api/the-envelope/).

| Code     | What it means                                                                                                                                                                                      | What to do                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ASK-1`  | There is no action by that name. An action here is a command the command line offers, and this surface offers nothing else. The message names what was asked for.                                  | Ask for one of the actions the contract names.                          |
| `ASK-2`  | An action was not given an argument it needs, so it was not carried out. The message names the action and the argument.                                                                            | Ask again with the arguments the action takes.                          |
| `ASK-3`  | An argument was given a value that names nothing this stack knows. The message names the argument, what it said, and what it could have said instead.                                              | Ask again with the arguments the action takes.                          |
| `ASK-4`  | An action was given an argument its command has nowhere to put. It is refused rather than dropped, because dropping it would carry out a different request from the one asked for.                 | Ask again with the arguments the action takes.                          |
| `ASK-5`  | An action was given two arguments that each name a different request. A run carrying both would have to pick one of them and answer something nobody asked for. The message names the two.         | Ask again with the arguments the action takes, choosing one of the two. |
| `ASK-6`  | The body of the request is not arguments the action can read. What the reader could not take from it — a field it did not know, or where the text stopped being JSON — is given as the detail.     | Ask again with the arguments the action takes.                          |
| `ASK-7`  | No work in this run goes by that name. Jobs are named by the run that starts them, and work from an earlier run is not tracked here.                                                               | Ask about a job this run started.                                       |
| `ASK-8`  | The body of a setup step is not one of setup's answers, nor a way out of an interrupted apply, so setup did not move. What arrived is not repeated back, because an answer can carry a credential. | Answer the question setup is asking.                                    |
| `ASK-9`  | No endpoint answers this path. Every endpoint this surface answers is named in the contract, and this path is not one of them.                                                                     | Ask for one of the endpoints the contract names.                        |
| `ASK-10` | The path is one this surface answers, asked with a method it does not answer it with, and nothing was done.                                                                                        | Ask again with the method the contract names.                           |
| `ASK-11` | The body of a request to mint a key is not a key's name, scope and purpose with the password, so no key was minted.                                                                                | Send the name, scope, purpose and password as the body's four fields.   |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
