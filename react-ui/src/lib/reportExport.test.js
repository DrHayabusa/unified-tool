import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildAnalysisWorkbook } from "./reportExport.js";
import { analyzeAdhocFiles } from "./vulnerabilityEngine.js";

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

async function fakeFile(filePath) {
  const blob = new Blob([await readFile(filePath)], { type: "text/csv" });
  Object.defineProperty(blob, "name", { value: path.basename(filePath) });
  return blob;
}
