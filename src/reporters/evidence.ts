// Registered as a reporter in playwright.config.ts. Writes debug/INDEX.md
// after every run and copies each test's video/screenshot out of
// outputDir (one folder per test) into debug/videos/ and
// debug/screenshots/ so the artifact contract in debug/README.md holds.
// The trace.zip stays where Playwright wrote it, under debug/traces/.
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';

function copyOut(srcPath: string | undefined, destDir: string, slug: string): string {
  if (!srcPath || !fs.existsSync(srcPath)) return '—';
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, `${slug}${path.extname(srcPath)}`);
  fs.copyFileSync(srcPath, dest);
  return dest;
}

export default class EvidenceReporter implements Reporter {
  private rows: string[] = [];
  private passed = 0;
  private failed = 0;

  onTestEnd(test: TestCase, result: TestResult) {
    const attach = (name: string) => result.attachments.find((a) => a.name === name)?.path;
    const slug = test.titlePath().slice(1).join('-').replace(/\W+/g, '-');
    const traceAbs = attach('trace');
    const trace = traceAbs ? path.relative(process.cwd(), traceAbs) : '—'; // already in debug/traces/<dir>/trace.zip
    const video = copyOut(attach('video'), 'debug/videos', slug);
    const shot = copyOut(attach('screenshot'), 'debug/screenshots', slug);
    const tags = test.title.match(/@\w+/g)?.join(' ') ?? '';
    const ann = test.annotations.map((a) => `${a.type}:${a.description}`).join('; ');
    if (result.status === 'passed') this.passed++;
    else if (result.status !== 'skipped') this.failed++;
    this.rows.push(
      `| ${test.titlePath().slice(1).join(' › ')} | ${result.status.toUpperCase()} ` +
        `| ${trace} | ${video} | ${shot} | ${tags} | ${ann} |`,
    );
  }

  onEnd() {
    fs.mkdirSync('debug', { recursive: true });
    const header = `# Evidence index\n\nRun: ${new Date().toISOString()} · ${this.passed} passed, ${this.failed} failed\n\n`;
    const table =
      `| test | status | trace | video | screenshot | tags | annotations |\n` +
      `|---|---|---|---|---|---|---|\n${this.rows.join('\n')}\n`;
    fs.writeFileSync('debug/INDEX.md', header + table);
  }
}
