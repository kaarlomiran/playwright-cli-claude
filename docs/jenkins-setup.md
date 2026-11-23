# Jenkins setup

This repo's `Jenkinsfile` (root) is the pipeline definition; this doc is the
one-time Jenkins-side configuration to wire it up so it runs on every PR
opened/updated against `main` and every merge into `main` — the same two
triggers already covered by `.github/workflows/playwright.yml` on the GitHub
Actions side. Keep both; they're independent and this doesn't replace that
workflow.

## Prerequisites on the Jenkins controller/agent

- **Node.js 20+** on the agent host's PATH — the `Jenkinsfile` uses
  `agent any` (runs directly on the Jenkins host, no Docker) and prepends
  `/opt/homebrew/bin` to `PATH` itself, since a Homebrew-installed Jenkins
  started via `brew services` launches with a minimal launchd PATH that
  doesn't include it otherwise.
- **GitHub Branch Source** plugin (also pulls in Git, GitHub, GitHub API
  plugins) — this is what gives Jenkins PR discovery, not a plain
  single-branch Pipeline job.
- **HTML Publisher** plugin — for `publishHTML` in the `Jenkinsfile`'s
  `post` block. Not in the default "suggested plugins" set — install it
  separately via Manage Jenkins → Plugins → Available.
- JUnit reporting (`junit` step) ships with Jenkins core — no extra plugin.

This repo's actual setup runs Jenkins natively via Homebrew
(`brew install jenkins-lts && brew services start jenkins-lts`, JENKINS_HOME
at `~/.jenkins`, port 8080) rather than in Docker — an earlier attempt to
provision a local Docker runtime (Colima) for a containerized agent hung
indefinitely on its VM image download in this environment, so builds run
directly on the host instead. If your Jenkins agent does have a working
Docker, you can still point `agent` back at a container (e.g.
`mcr.microsoft.com/playwright:v1.63.0-noble`, which has Node + browsers
preinstalled) — just also add the **Docker Pipeline** plugin.

## Create the job

1. **New Item → Multibranch Pipeline.** A single-branch Pipeline job can
   only build one ref; Multibranch is what discovers `main`, any PR
   branches, and runs the `Jenkinsfile` found in each.
2. **Branch Sources → Add → GitHub.**
   - Repository URL: `https://github.com/kaarlomiran/playwright-cli-claude`.
   - Credentials: even for a public repo, add a GitHub personal access
     token (no special scopes needed beyond public read) — anonymous
     GitHub API calls hit a low rate limit that a Multibranch job will
     burn through on every scan.
   - **Behaviours**: keep "Discover branches", and add "Discover pull
     requests from origin" with strategy **"Merging the pull request with
     the current target branch revision"** — this is what makes a PR build
     actually test the post-merge state, not just the PR branch in
     isolation.
3. **Build Configuration**: by Jenkinsfile, script path `Jenkinsfile`
   (default — matches this repo's root file).
4. **Scan Multibranch Pipeline Triggers**: enable "Periodically if not
   otherwise run" (e.g. every hour) as a fallback, but the real trigger is
   the webhook below — don't rely on polling alone.

## Webhook (so pushes/PRs trigger a build immediately, not on the next scan)

In the GitHub repo: **Settings → Webhooks → Add webhook**.
- Payload URL: `https://<your-jenkins-host>/github-webhook/`
- Content type: `application/json`
- Events: select **"Let me select individual events"** → check **Pushes**
  and **Pull requests** (covers both "PR opened/updated" and "PR merged",
  since a merge is itself a push to `main`).

If the Jenkins GitHub plugin is configured with a credential that has
admin rights on the repo (Manage Jenkins → System → GitHub Servers), it can
manage this webhook for you automatically instead — equivalent outcome,
less manual upkeep, but requires handing Jenkins a higher-privilege token.
The manual webhook above is the lower-privilege option and what's assumed
here.

## What each build produces

Same evidence contract as the GitHub Actions workflow, surfaced via Jenkins
instead of GitHub:

| Jenkins feature | Source |
|---|---|
| Test result trend / pass-fail per test | `junit` step reading `debug/reports/junit-results.xml` |
| "Playwright HTML Report" link on the build page | `publishHTML` serving `playwright-report/` |
| Downloadable traces/videos/screenshots | `archiveArtifacts` on `debug/` (kept even on failure) |

## Known gap

This doc covers the Jenkins-side job/webhook configuration for a Jenkins
instance that already exists. Provisioning or administering that Jenkins
controller itself (install, plugins, system credentials) is outside what
this session has access to — do that part directly in your Jenkins
instance, then this `Jenkinsfile` is what it should point at.
