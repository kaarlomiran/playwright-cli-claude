import fs from 'node:fs';
import path from 'node:path';

type Outcome = 'passed' | 'failed' | 'flaky' | 'skipped';
interface Row { id: string; title: string; file: string; outcome: Outcome;
  attempts: number; maxMs: number; error: string; tags: string[]; }

const RESULTS = process.env.RESULTS ?? 'debug/reports/results.json';
const HISTORY = process.env.HISTORY ?? 'debug/reports/history/flaky-history.json';
const OUT = process.env.OUT ?? 'debug/reports/FLAKY_REPORT.md';
const WINDOW = 20; // runs kept in history
const SLOW_MS = 5000; // slow-test threshold (UI tests run slower than API calls)
const strip = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0].slice(0, 160);

function collect(suite: any, rows: Row[]): void {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const rs: any[] = t.results ?? [];
      const outcome: Outcome = t.status === 'expected' ? 'passed'
        : t.status === 'unexpected' ? 'failed'
        : t.status === 'flaky' ? 'flaky' : 'skipped';
      rows.push({
        id: spec.title, title: spec.title, file: spec.file ?? '', outcome,
        attempts: rs.length,
        maxMs: Math.max(0, ...rs.map((r) => r.duration ?? 0)),
        error: strip(rs.map((r) => r.error?.message ?? '').find(Boolean) ?? ''),
        tags: spec.tags ?? [],
      });
    }
  }
  for (const s of suite.suites ?? []) collect(s, rows);
}

const report = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
const rows: Row[] = [];
for (const s of report.suites ?? []) collect(s, rows);

// ---- history (rolling window) ----
fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
const hist: { runs: { ts: string; build: string; results: Record<string, Outcome> }[] } =
  fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, 'utf8')) : { runs: [] };
hist.runs.push({
  ts: new Date().toISOString(), build: process.env.BUILD_NUMBER ?? 'local',
  results: Object.fromEntries(rows.map((r) => [r.id, r.outcome])),
});
hist.runs = hist.runs.slice(-WINDOW);
fs.writeFileSync(HISTORY, JSON.stringify(hist, null, 2));

// ---- scoring: a run is "unstable" if flaky, or if outcomes differ across runs ----
const known = (r: Row) => r.tags.includes('known-issue');
const rate = (id: string) => {
  const seen = hist.runs.map((h) => h.results[id]).filter(Boolean) as Outcome[];
  if (!seen.length) return { n: 0, bad: 0 };
  const failedRuns = seen.filter((o) => o === 'failed').length;
  const flakyRuns = seen.filter((o) => o === 'flaky').length;
  const mixed = failedRuns > 0 && failedRuns < seen.length ? failedRuns : 0; // fails sometimes only
  return { n: seen.length, bad: flakyRuns + mixed };
};

const flaky = rows.filter((r) => !known(r) && (r.outcome === 'flaky' || rate(r.id).bad > 0));
const failed = rows.filter((r) => r.outcome === 'failed');
const slow = rows.filter((r) => r.maxMs > SLOW_MS).sort((a, b) => b.maxMs - a.maxMs).slice(0, 10);
const count = (o: Outcome) => rows.filter((r) => r.outcome === o).length;

const L: string[] = [];
L.push('# Flaky Test Report', '');
L.push(`- Generated: ${new Date().toISOString()}`);
L.push(`- Build: ${process.env.BUILD_URL ?? process.env.BUILD_NUMBER ?? 'local run'}`);
L.push(`- Commit: ${process.env.GIT_COMMIT ?? 'n/a'}`);
L.push(`- History window: ${hist.runs.length} run(s) (max ${WINDOW})`, '');
L.push('## Summary', '', '| Total | Passed | Failed | Flaky (passed on retry) | Skipped |', '|---|---|---|---|---|');
L.push(`| ${rows.length} | ${count('passed')} | ${count('failed')} | ${count('flaky')} | ${count('skipped')} |`, '');

L.push('## Flaky / unstable tests', '');
if (!flaky.length) L.push('None detected in the current history window.', '');
else {
  L.push('| Test | This run | Unstable runs | Attempts | Last error |', '|---|---|---|---|---|');
  for (const r of flaky) {
    const h = rate(r.id);
    L.push(`| ${r.title.replace(/\|/g, '/')} | ${r.outcome} | ${h.bad}/${h.n} | ${r.attempts} | ${r.error.replace(/\|/g, '/') || '-'} |`);
  }
  L.push('');
}

L.push('## Hard failures (this run)', '');
if (!failed.length) L.push('None.', '');
else {
  L.push('| Test | Error |', '|---|---|');
  for (const r of failed) L.push(`| ${r.title.replace(/\|/g, '/')} | ${r.error.replace(/\|/g, '/')} |`);
  L.push('');
}

L.push(`## Slowest tests (> ${SLOW_MS} ms)`, '');
if (!slow.length) L.push('None.', '');
else {
  L.push('| Test | Max ms |', '|---|---|');
  for (const r of slow) L.push(`| ${r.title.replace(/\|/g, '/')} | ${Math.round(r.maxMs)} |`);
  L.push('');
}

L.push('## Issues to file', '');
if (!flaky.length && !failed.length) L.push('No issues.', '');
for (const r of [...flaky, ...failed]) {
  L.push(`### ${r.title}`, '', `- Status: ${r.outcome}`, `- File: \`${r.file}\``,
    `- Evidence: ${r.error || 'see HTML report / trace'}`,
    '- Repro: use the trace-debug skill (Mechanic A: `--debug=cli` + `attach`, or Mechanic B: read `error-context.md`)',
    '- Suspected cause: _(Claude fills in using the flaky-monitor skill)_',
    '- Suggested fix: _(Claude fills in)_', '');
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`Wrote ${OUT}: ${flaky.length} flaky/unstable, ${failed.length} failed, ${rows.length} total`);
