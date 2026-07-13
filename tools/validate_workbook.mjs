#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile } from "@oai/artifact-tool";


const args = parseArgs(process.argv.slice(2));
const inputPath = args.input ?? "output/excel/mva_crowdstrike_final_team_sample.xlsx";
const outputDir = args.output ?? "output/validation/workbook";
const input = await fs.readFile(inputPath);
const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
const workbook = await SpreadsheetFile.importXlsx(arrayBuffer);

await fs.mkdir(outputDir, { recursive: true });

const sheetInspection = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
const keyRanges = await workbook.inspect({
  kind: "region",
  sheetId: "Executive Dashboard",
  range: "A1:L52",
  maxChars: 12000,
});

await fs.writeFile(path.join(outputDir, "sheets.inspect.ndjson"), sheetInspection.ndjson ?? "", "utf8");
await fs.writeFile(path.join(outputDir, "formula-errors.inspect.ndjson"), formulaErrors.ndjson ?? "", "utf8");
await fs.writeFile(path.join(outputDir, "executive.inspect.ndjson"), keyRanges.ndjson ?? "", "utf8");

const renders = [
  ["Executive Dashboard", "executive-dashboard.png"],
  ["Monthly Dashboard", "monthly-dashboard.png"],
  ["Adhoc Dashboard", "adhoc-dashboard.png"],
];

for (const [sheetName, filename] of renders) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1.25, format: "png" });
  await fs.writeFile(path.join(outputDir, filename), new Uint8Array(await preview.arrayBuffer()));
}

const errorRecords = (formulaErrors.ndjson ?? "")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((record) => record.kind !== "notice");
const result = {
  input: inputPath,
  outputDir,
  sheets: renders.map(([sheetName]) => sheetName),
  formulaErrorMatches: errorRecords.length,
  status: errorRecords.length === 0 ? "PASS" : "REVIEW",
};
await fs.writeFile(path.join(outputDir, "validation.json"), JSON.stringify(result, null, 2), "utf8");
console.log(JSON.stringify(result, null, 2));


function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) continue;
    parsed[argv[index].slice(2)] = argv[index + 1];
    index += 1;
  }
  return parsed;
}
