import type {
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StepReport {
  name: string;
  status: 'passed' | 'failed';
  screenshot?: string; // base64
}

interface TestReport {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
  steps: StepReport[];
}

interface SuiteReport {
  title: string;
  file: string;
  tests: TestReport[];
  passed: number;
  failed: number;
}

interface ReportData {
  generatedAt: string;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  duration: number;
  suites: SuiteReport[];
}

export default class ScreenshotReporter implements Reporter {
  private outputDir: string;
  private suites: Map<string, SuiteReport> = new Map();
  private startTime = Date.now();

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir ?? 'e2e-report';
  }

  onBegin(_config: unknown, _suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const suiteKey = test.location.file;
    const suiteTitle = test.parent?.title ?? path.basename(suiteKey);

    if (!this.suites.has(suiteKey)) {
      this.suites.set(suiteKey, {
        title: suiteTitle,
        file: suiteKey,
        tests: [],
        passed: 0,
        failed: 0,
      });
    }

    const suite = this.suites.get(suiteKey)!;

    const steps: StepReport[] = result.attachments
      .filter((a) => a.contentType === 'image/png' && a.body)
      .map((a) => ({
        name: a.name,
        status: a.name.startsWith('❌') ? 'failed' : 'passed',
        screenshot: a.body!.toString('base64'),
      }));

    suite.tests.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message?.replace(/\x1b\[[0-9;]*m/g, ''), // strip ANSI
      steps,
    });

    if (result.status === 'passed') suite.passed++;
    else if (result.status === 'failed' || result.status === 'timedOut') suite.failed++;
  }

  onEnd(): void {
    const report: ReportData = {
      generatedAt: new Date().toISOString(),
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      duration: Date.now() - this.startTime,
      suites: Array.from(this.suites.values()),
    };

    for (const s of report.suites) {
      report.totalPassed += s.passed;
      report.totalFailed += s.failed;
      report.totalSkipped += s.tests.filter((t) => t.status === 'skipped').length;
    }

    fs.mkdirSync(this.outputDir, { recursive: true });

    const templatePath = path.join(__dirname, 'report-template.html');
    const template = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf-8')
      : FALLBACK_TEMPLATE;

    const html = template.replace('"__REPORT_DATA__"', JSON.stringify(report));
    const htmlPath = path.join(this.outputDir, 'index.html');
    fs.writeFileSync(htmlPath, html);

    const absPath = path.resolve(htmlPath).replace(/\\/g, '/');
    console.log(`\n📊 E2E Screenshot Report → file:///${absPath}`);
  }
}

const FALLBACK_TEMPLATE = `<!DOCTYPE html><html><head><title>E2E Report</title></head><body>
  <script id="d" type="application/json">"__REPORT_DATA__"</script>
  <pre id="out"></pre>
  <script>document.getElementById('out').textContent =
    JSON.stringify(JSON.parse(document.getElementById('d').textContent), null, 2);</script>
</body></html>`;
