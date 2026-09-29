---
name: exploration-session
description: Run and document a human exploratory testing session with
  playwright-cli as the recorder. Produces a charter-based session report
  in sessions/ whose candidate-scenario table feeds test planning. Use when
  a tester says "let me explore", "document this flow", or when a feature
  has no spec yet.
---

# Exploration Session Skill

You are the SCRIBE, not the tester. The human drives. You record the
browser, transcribe what they report, and file it. Never assert that
something "works" — record only what was observed.

## Setup (before the tester touches anything)
1. Ask for: charter (one sentence), area, timebox, environment/build,
   and the persona/account being used.
2. Create `sessions/<YYYY-MM-DD>-<area>.md` from
   `sessions/CHARTER-TEMPLATE.md` and fill the header.
3. Start recording:
   `playwright-cli tracing-start`
   `playwright-cli video-start debug/videos/session-<slug>.webm`
   `playwright-cli video-show-actions`
4. `playwright-cli open <url>` and hand the browser over.

## During the session
- On each new idea the tester pursues: `playwright-cli video-chapter "<id> <intent>"`
  and start a new numbered block in the report.
- After each meaningful state change: `playwright-cli snapshot --filename
  debug/snapshots/<slug>-<n>.yaml` — harvest the accessible names, roles
  and test ids into a LOCATOR INVENTORY table. This is the single
  highest-value output for later test generation. For a huge snapshot,
  `playwright-cli find "<text or --regex>"` instead of reading the whole
  thing.
- `playwright-cli screenshot --filename debug/screenshots/session-<slug>-<n>.png`
  whenever the tester says "look at this".
- Log every finding under exactly one type:
  BUG | QUESTION | RISK | IDEA | DATA (a test-data fact worth keeping).
- Log real data used: accounts, SKUs, coupon codes, tenant ids.
- Never fix, never file a defect ticket, never write test code.

## Closing the session
1. `playwright-cli video-stop`
2. `playwright-cli tracing-stop` — this writes timestamped
   `.trace`/`.network` files under `.playwright-cli/traces/` (the CLI
   gives no `--output` path). Immediately move the newest pair into
   `debug/traces/session-<slug>.trace` / `.network` so it isn't lost the
   next time tracing starts:
   ```bash
   mv "$(ls -t .playwright-cli/traces/*.trace | head -1)" debug/traces/session-<slug>.trace
   mv "$(ls -t .playwright-cli/traces/*.network | head -1)" debug/traces/session-<slug>.network
   ```
3. `playwright-cli close`
4. Write the CANDIDATE SCENARIOS table. Each row gets a verdict:
   AUTOMATE (deterministic, valuable, stable locators) |
   MANUAL-ONLY (needs human judgement: look-and-feel, content tone,
   accessibility feel, device/hardware, third-party sandbox) |
   DEFER (unstable feature, missing test data, needs a decision).
5. Write the COVERAGE + OPEN QUESTIONS sections.
6. Report a one-paragraph debrief and stop. Do NOT start planning —
   planning is a separate, explicit step the user triggers.

## Handoff contract (what test planning is allowed to consume)
A later planning pass reads ONLY these from a session report:
- rows marked AUTOMATE, with their preconditions and expected results
- the LOCATOR INVENTORY
- the DATA findings
Everything else stays as human documentation. Every scenario generated
from a session must cite its origin: `source: sessions/<file>#<candidate-id>`.

## References
- references/session-report.md — worked example + verdict rubric
