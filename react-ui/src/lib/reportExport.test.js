import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildAnalysisWorkbook } from "./reportExport.js";
import { buildRemediationPrompt, buildTemplateMarkdown, createRemediationPdfDocument } from "./pdfReport.js";
import { analyzeAdhocFiles, analyzeMonthlyFiles } from "./vulnerabilityEngine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const CASES = [
  ["tenable-sc", "samples/tenable_100_row/tenable_sc_july_2026_100plus.csv"],
  ["tenable-io", "samples/tenable_100_row/tenable_io_july_2026_100plus.csv"],
  ["qualys", "samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv"],
  ["crowdstrike", "samples/crowdstrike_100_row/crowdstrike_vulnerabilities_july_2026_100plus.csv"],
];

test("every scanner produces a populated source-neutral Adhoc workbook", async () => {
  for (const [sourceId, relativePath] of CASES) {
    const filePath = path.join(root, relativePath);
    const analysis = await analyzeAdhocFiles([await fakeFile(filePath)], sourceId);
    const workbook = await buildAnalysisWorkbook(analysis);
    const dashboard = workbook.getWorksheet("Adhoc Report");
    const data = workbook.getWorksheet("Report Data");

    assert.ok(dashboard, `${sourceId}: Adhoc Report sheet`);
    assert.ok(data, `${sourceId}: Report Data sheet`);
    assert.equal(data.actualRowCount, analysis.findings.length + 1, `${sourceId}: complete normalized rows`);
    assert.match(String(dashboard.getCell("A1").value), /Adhoc Vulnerability Report$/, sourceId);
    assert.doesNotMatch(String(dashboard.getCell("A1").value), /Adhoc Adhoc/, sourceId);

    const dashboardText = dashboard.getSheetValues().flat(3).filter(Boolean).join(" | ");
    assert.match(dashboardText, /Top 10 Affected Assets/, sourceId);
    assert.match(dashboardText, /Affected Asset Concentration/, sourceId);
    assert.doesNotMatch(dashboardText, /Top Products/, sourceId);
    assert.equal(dashboard.getCell("A21").value, analysis.dashboard.top10AffectedAssets[0].asset, `${sourceId}: full asset label`);
    assert.equal(dashboard.getCell("F21").value, analysis.dashboard.top10AffectedAssets[0].vulnerabilityCount, `${sourceId}: asset count`);
    assert.equal(dashboard.getCell("G21").value, analysis.dashboard.top10AffectedAssets[0].asset, `${sourceId}: concentration label`);

    for (let row = 2; row <= data.actualRowCount; row += 1) {
      assert.ok(data.getCell(row, 1).value || data.getCell(row, 2).value, `${sourceId}: asset identity at row ${row}`);
      assert.notEqual(data.getCell(row, 3).value, "N/A", `${sourceId}: vulnerability name at row ${row}`);
      assert.match(String(data.getCell(row, 7).value), /^P[1-4]$/, `${sourceId}: patch priority at row ${row}`);
      assert.equal(typeof data.getCell(row, 8).value, "number", `${sourceId}: numeric exposure at row ${row}`);
      assert.notEqual(data.getCell(row, 12).value, "N/A", `${sourceId}: remediation at row ${row}`);
    }
  }
});

test("Qualys Adhoc workbook explains dates absent from the source export", async () => {
  const filePath = path.join(root, "samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv");
  const analysis = await analyzeAdhocFiles([await fakeFile(filePath)], "qualys");
  const workbook = await buildAnalysisWorkbook(analysis);
  const data = workbook.getWorksheet("Report Data");

  assert.equal(data.actualRowCount, 126);
  for (let row = 2; row <= data.actualRowCount; row += 1) {
    assert.equal(data.getCell(row, 15).value, "Not provided by source export");
    assert.equal(data.getCell(row, 16).value, "Not provided by source export");
  }
});

test("Unified workbook preserves scanner provenance and consolidation audit", async () => {
  const files = await Promise.all(CASES.map(([, relativePath]) => fakeFile(path.join(root, relativePath.replace("qualys_adhoc", "qualys_monthly")))));
  const analysis = await analyzeAdhocFiles(files, { mode: "multi", sourceIds: CASES.map(([sourceId]) => sourceId) });
  const workbook = await buildAnalysisWorkbook(analysis);
  const data = workbook.getWorksheet("Report Data");
  const audit = workbook.getWorksheet("Source Audit");
  const unified = workbook.getWorksheet("Unified Dashboard");

  assert.equal(workbook.worksheets[0].name, "Unified Dashboard");
  assert.ok(unified);
  assert.ok(audit);
  assert.equal(unified.getCell("A1").value, "Unified Multi-Tool Combined Analysis");
  assert.equal(unified.getCell("A5").value, 160);
  assert.equal(unified.getCell("I5").value, 113);
  assert.equal(unified.getCell("A10").value, 40);
  assert.equal(unified.getCell("E10").value, 120);
  assert.equal(unified.getCell("I10").value, "25%");
  assert.equal(data.getCell("F1").value, "Exploit Available");
  assert.equal(data.getCell("Q1").value, "Source Tools");
  assert.equal(data.getCell("R1").value, "Record Count");
  assert.ok(data.getColumn(17).values.slice(2).every((value) => String(value).length > 0));
  assert.equal(audit.getCell("A1").value, "Unified Multi-Tool Source Audit");
  assert.equal(audit.getCell("A5").value, 4);
  assert.equal(audit.getCell("C5").value, 4);
  assert.equal(audit.getCell("E5").value, analysis.dashboard.totalVulnerabilities);
  assert.equal(audit.getCell("H5").value, analysis.inputSummary.duplicatesRemoved);
});

test("Unified monthly Excel and PDF contain combined analysis plus remediations", async () => {
  const files = await Promise.all(["april", "may", "june", "july"].flatMap((month) => [
    path.join(root, "samples", "tenable_100_row", `tenable_sc_${month}_2026_100plus.csv`),
    path.join(root, "samples", "tenable_100_row", `tenable_io_${month}_2026_100plus.csv`),
  ]).map(fakeFile));
  const analysis = await analyzeMonthlyFiles(files, { mode: "multi", sourceIds: ["tenable-sc", "tenable-io"] });
  const workbook = await buildAnalysisWorkbook(analysis);
  const unified = workbook.getWorksheet("Unified Dashboard");
  const dashboardText = unified.getSheetValues().flat(3).filter(Boolean).join(" | ");

  assert.equal(workbook.worksheets[0].name, "Unified Dashboard");
  assert.match(dashboardText, /Combined Portfolio Trend/);
  assert.match(dashboardText, /Highest-Risk Assets/);
  assert.match(dashboardText, /Highest-Impact Vulnerabilities/);
  assert.match(dashboardText, /Scanner Contribution/);
  assert.equal(unified.getCell("A15").value, "Period");
  assert.equal(unified.getCell("A16").value, "April 2026");
  assert.equal(unified.getCell("B19").value, 40);

  const markdown = buildTemplateMarkdown({ analysis, targetMonth: "July 2026" });
  const prompt = buildRemediationPrompt({ analysis, targetMonth: "July 2026" });
  assert.match(markdown, /## 1\. Portfolio Risk Overview/);
  assert.match(markdown, /## 2\. Trend Analysis/);
  assert.match(markdown, /Cross-tool Confirmed/);
  assert.match(markdown, /Scanner Contribution/);
  assert.match(markdown, /## 3\. Remediation Actions/);
  assert.match(prompt, /Combined portfolio analytics for the selected reporting period/);
  assert.match(prompt, /"crossToolConfirmed": 40/);

  const pdf = await createRemediationPdfDocument({ markdown, sourceLabel: analysis.sourceLabel, targetMonth: "July 2026", workflow: "monthly" });
  const bytes = Buffer.from(pdf.output("arraybuffer"));
  assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.getNumberOfPages() >= 3);
});

async function fakeFile(filePath) {
  const blob = new Blob([await readFile(filePath)], { type: "text/csv" });
  Object.defineProperty(blob, "name", { value: path.basename(filePath) });
  return blob;
}
