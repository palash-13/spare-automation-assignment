/**
 * Converts Bun's JUnit XML (reports/api-junit.xml) into a standalone HTML report.
 * Bun's test runner has no HTML reporter, so this keeps the API suite on par with Playwright's report.
 * Usage: bun run test:api:report   (runs the API suite, then writes reports/api-report.html)
 */
const INPUT = "reports/api-junit.xml";
const OUTPUT = "reports/api-report.html";

type Status = "passed" | "failed" | "skipped";

interface TestCase {
  file: string;
  suite: string;
  name: string;
  line: string;
  time: number;
  assertions: string;
  status: Status;
  message: string;
}

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function attrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, key, value] of raw.matchAll(/(\w+)="([^"]*)"/g)) out[key!] = decode(value!);
  return out;
}

function parse(xml: string): TestCase[] {
  const cases: TestCase[] = [];
  for (const [, rawAttrs, , body = ""] of xml.matchAll(/<testcase\s([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const a = attrs(rawAttrs!);
    const failure = body.match(/<failure([^>]*)>([\s\S]*?)<\/failure>|<failure([^>]*)\/>/);
    const status: Status = failure ? "failed" : body.includes("<skipped") ? "skipped" : "passed";
    // The element body is the full error (message + location); fall back to the message attribute
    const message = failure ? decode(failure[2] || attrs(failure[1] ?? failure[3] ?? "").message || "").trim() : "";
    cases.push({
      file: a.file ?? "",
      suite: a.classname ?? "",
      name: a.name ?? "",
      line: a.line ?? "",
      time: Number(a.time ?? 0),
      assertions: a.assertions ?? "0",
      status,
      message,
    });
  }
  return cases;
}

function render(cases: TestCase[]): string {
  const count = (s: Status) => cases.filter((c) => c.status === s).length;
  const total = cases.reduce((sum, c) => sum + c.time, 0);
  const skipNote = count("skipped")
    ? `<p class="note">Skipped tests need <code>PH_TOKEN</code> (Product Hunt developer token) in <code>.env</code>.</p>`
    : "";

  const rows = cases
    .map(
      (c) => `
      <tr class="${c.status}">
        <td><span class="badge ${c.status}">${c.status}</span></td>
        <td>
          <div class="name">${escape(c.name)}</div>
          <div class="meta">${escape(c.suite)} · ${escape(c.file)}:${c.line}</div>
          ${c.message ? `<pre>${escape(c.message)}</pre>` : ""}
        </td>
        <td class="num">${c.assertions}</td>
        <td class="num">${c.status === "skipped" ? "—" : `${Math.round(c.time * 1000)} ms`}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>API Test Report</title>
<style>
  :root { --bg:#fff; --fg:#1f2328; --muted:#656d76; --border:#d0d7de; --row:#f6f8fa;
          --pass:#1a7f37; --fail:#cf222e; --skip:#9a6700; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0d1117; --fg:#e6edf3; --muted:#8d96a0; --border:#30363d; --row:#161b22;
            --pass:#3fb950; --fail:#f85149; --skip:#d29922; }
  }
  body { margin:0; padding:24px 16px; background:var(--bg); color:var(--fg);
         font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:960px; margin:0 auto; }
  h1 { font-size:22px; margin:0 0 4px; }
  .sub { color:var(--muted); margin:0 0 20px; }
  .stats { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
  .stat { border:1px solid var(--border); border-radius:8px; padding:10px 16px; min-width:90px; }
  .stat b { display:block; font-size:22px; }
  .stat.passed b { color:var(--pass); } .stat.failed b { color:var(--fail); } .stat.skipped b { color:var(--skip); }
  .note { color:var(--muted); }
  table { width:100%; border-collapse:collapse; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:top; }
  th { background:var(--row); font-weight:600; }
  .num { text-align:right; white-space:nowrap; color:var(--muted); }
  .name { font-weight:500; }
  .meta { color:var(--muted); font-size:12px; }
  .badge { font-size:12px; font-weight:600; padding:2px 8px; border-radius:999px; border:1px solid currentColor; }
  .badge.passed { color:var(--pass); } .badge.failed { color:var(--fail); } .badge.skipped { color:var(--skip); }
  pre { white-space:pre-wrap; background:var(--row); padding:8px; border-radius:6px; font-size:12px; overflow-x:auto; }
  code { font-size:13px; }
</style>
</head>
<body>
<main>
  <h1>API Test Report</h1>
  <p class="sub">Product Hunt GraphQL API · Bun test · ${new Date().toLocaleString()}</p>
  <div class="stats">
    <div class="stat"><b>${cases.length}</b>total</div>
    <div class="stat passed"><b>${count("passed")}</b>passed</div>
    <div class="stat failed"><b>${count("failed")}</b>failed</div>
    <div class="stat skipped"><b>${count("skipped")}</b>skipped</div>
    <div class="stat"><b>${total.toFixed(2)}s</b>duration</div>
  </div>
  ${skipNote}
  <table>
    <thead><tr><th>Status</th><th>Test</th><th class="num">Assertions</th><th class="num">Time</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</main>
</body>
</html>
`;
}

// Run the suite first so the report is written even when tests fail; exit with the suite's code for CI
const run = Bun.spawnSync(["bun", "test", "api", "--reporter=junit", `--reporter-outfile=${INPUT}`], {
  stdout: "inherit",
  stderr: "inherit",
});

const xml = await Bun.file(INPUT).text();
const cases = parse(xml);
await Bun.write(OUTPUT, render(cases));
console.log(`\nAPI report: ${OUTPUT} (${cases.length} tests)`);
process.exit(run.exitCode ?? 1);
