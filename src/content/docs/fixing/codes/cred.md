---
title: CRED — credentials a service refuses
description: Every CRED code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised when a service or an indexer rejects a key it should accept.

| Code     | What it means                                                                                                                                                                                                                            | What to do                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `CRED-1` | A service answered and refused the credential it generated itself. The key in its configuration no longer matches the one the running service expects, usually because the configuration was regenerated after the service last started. | Restart the service so it reloads its configuration, then check again: `lemonfiber restart`. |
| `CRED-2` | The indexer answered and rejected the API key configured for it. The key is wrong, expired, or for a different indexer — searches through it come back empty.                                                                            | Correct the indexer's API key in configuration, then check again.                            |
| `CRED-3` | The indexer accepted the key and would not serve the request — usually a rate or quota limit that lifts on its own. The key is not wrong.                                                                                                | Leave it a while and check again.                                                            |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
