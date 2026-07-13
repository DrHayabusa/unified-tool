const COLORS = {
  navy: "14213D",
  slate: "334155",
  pale: "F8FAFC",
  border: "CBD5E1",
  white: "FFFFFF",
  teal: "0F766E",
  critical: "DC2626",
  high: "EA580C",
  medium: "CA8A04",
  low: "16A34A",
  P1: "DC2626",
  P2: "EA580C",
  P3: "CA8A04",
  P4: "16A34A",
};

const FINDING_COLUMNS = [
  ["IP Address", "ipAddress", 17],
  ["DNS Name", "dnsName", 30],
  ["Vulnerability Name", "vulnerabilityName", 44],
  ["CVE", "cve", 20],
  ["Severity", "severity", 12],
  ["Exploit Availability", "exploitAvailable", 19],
  ["Patch Priority", "patchPriority", 14],
  ["Asset Exposure (on 1000)", "assetExposure", 23],
  ["Vulnerability Finding", "vulnerabilityFinding", 44],
  ["Summary", "summary", 40],
  ["Description", "description", 48],
  ["Remediation", "remediation", 48],
  ["KB Links", "kbLinks", 46],
  ["Platform Details", "platformDetails", 34],
  ["First Discovered", "firstDiscovered", 17],
  ["Last Observed", "lastObserved", 17],
  ["Record Count", "recordCount", 14],
];

export async function downloadAnalysisWorkbook(analysis) {
  if (!analysis) throw new Error("Analyze CSV data before generating the Excel report.");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MVA Unified Agent";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `${analysis.sourceLabel} vulnerability report`;

  if (analysis.workflow === "monthly") buildMonthlySheet(workbook, analysis);
  else buildAdhocSheet(workbook, analysis);
  buildFindingsSheet(workbook, analysis.workflow === "monthly" ? analysis.currentFindings : analysis.findings);

  const buffer = await workbook.xlsx.writeBuffer();
  const suffix = analysis.workflow === "monthly" ? analysis.dashboard.uploadedMonths.at(-1).replaceAll(" ", "_") : "Adhoc";
  saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `MVA_${safeName(analysis.sourceLabel)}_${suffix}_Report.xlsx`);
}

export function downloadNormalizedCsv(analysis) {
  if (!analysis) throw new Error("Analyze CSV data before downloading normalized findings.");
  const findings = analysis.workflow === "monthly" ? analysis.currentFindings : analysis.findings;
  const rows = [FINDING_COLUMNS.map(([header]) => header)];
  for (const finding of findings) {
    rows.push(FINDING_COLUMNS.map(([, key]) => key === "exploitAvailable" ? (finding[key] ? "Yes" : "No") : finding[key] ?? ""));
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  saveBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `MVA_${safeName(analysis.sourceLabel)}_Normalized_Findings.csv`);
}

function buildMonthlySheet(workbook, analysis) {
  const sheet = workbook.addWorksheet("Monthly Report", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const dashboard = analysis.dashboard;
  const open = dashboard.totalOpenVulnerabilities;
  const patched = dashboard.totalVulnerabilitiesPatchedLastMonth;
  prepareSheet(sheet, 12);
  title(sheet, `${analysis.sourceLabel} Monthly Vulnerability Report`, dashboard.reportRange, 12);

  kpi(sheet, "A4:C7", "TOTAL OPEN", open.totalOpen, "New + not closed", COLORS.teal);
  kpi(sheet, "D4:F7", "NEW THIS MONTH", open.newVulnerabilities, "Identified in current report", "0284C7");
  kpi(sheet, "G4:I7", "NOT CLOSED", open.notClosedFromPreviousMonths, "Carried from previous report", COLORS.high);
  kpi(sheet, "J4:L7", "PATCHED LAST MONTH", patched.patchedCount, `${patched.previousMonth} to ${patched.currentMonth}`, COLORS.low);

  section(sheet, "A9:F9", "1. Vulnerabilities Discovered - Last 3 Months");
  writeTable(sheet, 10, 1, ["Month", "Discovered"], dashboard.trendDiscoveredLast3Months.map((row) => [row.month, row.discoveredCount]));
  sparkBars(sheet, 10, 4, dashboard.trendDiscoveredLast3Months.map((row) => [row.month, row.discoveredCount]), "0284C7");

  section(sheet, "G9:L9", "2. Total Open Vulnerabilities");
  writeTable(sheet, 10, 7, ["Measure", "Count"], [
    ["Total Open", open.totalOpen],
    ["New Vulnerabilities", open.newVulnerabilities],
    ["Not Closed", open.notClosedFromPreviousMonths],
  ]);

  section(sheet, "A16:L16", "3. Total Open by Patch Priority");
  ["P1", "P2", "P3", "P4"].forEach((priority, index) => {
    const start = 1 + index * 3;
    kpi(sheet, `${column(start)}17:${column(start + 2)}20`, priority, dashboard.totalOpenByPatchPriority[priority], "Open findings", COLORS[priority]);
  });

  section(sheet, "A22:F22", "4. Total Open by Age and Patch Priority");
  writeTable(
    sheet,
    23,
    1,
    ["Patch Priority", ">7 days", ">30 days", ">60 days", ">180 days"],
    ["P1", "P2", "P3", "P4"].map((priority) => [
      priority,
      dashboard.totalOpenByAgeAndPatchPriority[priority][">7 days"],
      dashboard.totalOpenByAgeAndPatchPriority[priority][">30 days"],
      dashboard.totalOpenByAgeAndPatchPriority[priority][">60 days"],
      dashboard.totalOpenByAgeAndPatchPriority[priority][">180 days (6+ months)"],
    ]),
    true,
  );

  section(sheet, "G22:L22", "5. Vulnerabilities Patched in Last Month");
  writeTable(sheet, 23, 7, ["Measure", "Count", "Report Month"], [
    ["Previous Month Open", patched.previousMonthOpen, patched.previousMonth],
    ["New This Month", patched.newVulnerabilitiesIdentifiedThisMonth, patched.currentMonth],
    ["Current Month Open", patched.currentMonthOpen, patched.currentMonth],
    ["Patched Last Month", patched.patchedCount, patched.currentMonth],
  ]);

  section(sheet, "A31:L31", "Uploaded Month Summary");
  writeTable(
    sheet,
    32,
    1,
    ["Month", "Critical", "High", "Medium", "Low", "Total Open", "New", "Patched"],
    dashboard.severityTrend.map((row, index) => [
      row.month,
      row.Critical,
      row.High,
      row.Medium,
      row.Low,
      row.totalOpen,
      dashboard.openTrend[index].newThisMonth,
      dashboard.openTrend[index].patchedSinceLastMonth,
    ]),
  );

  if (dashboard.crowdstrikeInsights) {
    section(sheet, "A40:L40", "CrowdStrike Exposure Signals");
    const insight = dashboard.crowdstrikeInsights;
    kpi(sheet, "A41:C44", "EXPLOIT AVAILABLE", insight.exploitAvailable, "Known exploit signal", COLORS.high);
    kpi(sheet, "D41:F44", "CISA KEV", insight.cisaKev, "Cataloged exploited CVEs", COLORS.critical);
    kpi(sheet, "G41:I44", "INTERNET EXPOSED", insight.internetExposed, "Open findings", "0891B2");
    kpi(sheet, "J41:L44", "CRITICAL ASSETS", insight.criticalAssets, "Distinct assets", "7C3AED");
  }
}

function buildAdhocSheet(workbook, analysis) {
  const sheet = workbook.addWorksheet("Adhoc Report", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const dashboard = analysis.dashboard;
  prepareSheet(sheet, 12);
  title(sheet, `${analysis.sourceLabel} Adhoc Vulnerability Report`, `${analysis.exportType} | ${analysis.fileName}`, 12);
  kpi(sheet, "A4:C7", "TOTAL VULNERABILITIES", dashboard.totalVulnerabilities, "Open findings", COLORS.teal);
  kpi(sheet, "D4:F7", "DISTINCT ASSETS", dashboard.distinctAssets, "Affected assets", "0284C7");
  kpi(sheet, "G4:I7", "EXPLOIT AVAILABLE", dashboard.exploitAvailable, "Known exploit signal", COLORS.high);
  kpi(sheet, "J4:L7", "IMMEDIATE PATCH", (dashboard.patchPriorityCounts.P1 ?? 0) + (dashboard.patchPriorityCounts.P2 ?? 0), "P1 + P2", COLORS.critical);

  section(sheet, "A9:F9", "Severity Distribution");
  writeTable(sheet, 10, 1, ["Severity", "Count"], Object.entries(dashboard.severityCounts));
  section(sheet, "G9:L9", "Patch Priority Distribution");
  writeTable(sheet, 10, 7, ["Patch Priority", "Count"], Object.entries(dashboard.patchPriorityCounts), true);

  section(sheet, "A19:F19", "Top 10 Affected Assets");
  writeTable(sheet, 20, 1, ["Asset", "Vulnerability Count"], dashboard.top10AffectedAssets.map((row) => [row.asset, row.vulnerabilityCount]));
  section(sheet, "G19:L19", "Top Products");
  writeTable(sheet, 20, 7, ["Product", "Vulnerability Count"], dashboard.topProducts.map((row) => [row.product, row.vulnerabilityCount]));
}

function buildFindingsSheet(workbook, findings) {
  const sheet = workbook.addWorksheet("Report Data", { views: [{ state: "frozen", ySplit: 1, xSplit: 2, showGridLines: false }] });
  sheet.columns = FINDING_COLUMNS.map(([header, key, width]) => ({ header, key, width }));
  const rows = findings.map((finding) => Object.fromEntries(FINDING_COLUMNS.map(([, key]) => [key, key === "exploitAvailable" ? (finding[key] ? "Yes" : "No") : finding[key] ?? ""])));
  sheet.addRows(rows);
  styleHeader(sheet.getRow(1));
  sheet.autoFilter = { from: "A1", to: `${column(FINDING_COLUMNS.length)}${Math.max(1, rows.length + 1)}` };
  sheet.getColumn(8).numFmt = "0";
  sheet.getColumn(17).numFmt = "0";
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: "top", wrapText: false };
    row.height = 18;
    if (rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    const severity = row.getCell(5);
    const severityColor = COLORS[String(severity.value).toLowerCase()] ?? COLORS.slate;
    severity.font = { bold: true, color: { argb: `FF${severityColor}` } };
    const priority = row.getCell(7);
    const priorityColor = COLORS[priority.value] ?? COLORS.slate;
    priority.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${priorityColor}` } };
    priority.font = { bold: true, color: { argb: `FF${COLORS.white}` } };
  });
}

function prepareSheet(sheet, columns) {
  for (let index = 1; index <= columns; index += 1) sheet.getColumn(index).width = 14;
  sheet.properties.defaultRowHeight = 20;
}

function title(sheet, heading, subtitle, columns) {
  sheet.mergeCells(1, 1, 1, columns);
  sheet.getCell("A1").value = heading;
  sheet.getCell("A1").font = { bold: true, size: 20, color: { argb: `FF${COLORS.white}` } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.navy}` } };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 32;
  sheet.mergeCells(2, 1, 2, columns);
  sheet.getCell("A2").value = subtitle;
  sheet.getCell("A2").font = { color: { argb: `FF${COLORS.slate}` }, size: 10 };
  sheet.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
}

function kpi(sheet, range, label, value, helper, color) {
  const [start, end] = range.split(":");
  const startCell = sheet.getCell(start);
  const endCell = sheet.getCell(end);
  sheet.mergeCells(startCell.row, startCell.col, startCell.row, endCell.col);
  sheet.getCell(startCell.row, startCell.col).value = label;
  sheet.getCell(startCell.row, startCell.col).fill = solid(COLORS.navy);
  sheet.getCell(startCell.row, startCell.col).font = { bold: true, size: 9, color: { argb: `FF${COLORS.white}` } };
  sheet.mergeCells(startCell.row + 1, startCell.col, startCell.row + 2, endCell.col);
  const valueCell = sheet.getCell(startCell.row + 1, startCell.col);
  valueCell.value = value;
  valueCell.fill = solid("F8FAFC");
  valueCell.font = { bold: true, size: 22, color: { argb: `FF${color}` } };
  valueCell.alignment = { vertical: "middle" };
  sheet.mergeCells(endCell.row, startCell.col, endCell.row, endCell.col);
  const helperCell = sheet.getCell(endCell.row, startCell.col);
  helperCell.value = helper;
  helperCell.fill = solid("F8FAFC");
  helperCell.font = { size: 9, color: { argb: `FF${COLORS.slate}` } };
  for (let row = startCell.row; row <= endCell.row; row += 1) {
    for (let col = startCell.col; col <= endCell.col; col += 1) {
      sheet.getCell(row, col).border = { bottom: { style: "thin", color: { argb: `FF${color}` } } };
    }
  }
}

function section(sheet, range, text) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = text;
  cell.fill = solid("E2E8F0");
  cell.font = { bold: true, size: 11, color: { argb: `FF${COLORS.navy}` } };
}

function writeTable(sheet, startRow, startColumn, headers, rows, colorPriority = false) {
  headers.forEach((header, offset) => {
    const cell = sheet.getCell(startRow, startColumn + offset);
    cell.value = header;
    cell.fill = solid(COLORS.navy);
    cell.font = { bold: true, color: { argb: `FF${COLORS.white}` } };
    cell.alignment = { vertical: "middle" };
  });
  rows.forEach((values, rowOffset) => {
    values.forEach((value, columnOffset) => {
      const cell = sheet.getCell(startRow + rowOffset + 1, startColumn + columnOffset);
      cell.value = value;
      cell.fill = solid(rowOffset % 2 === 0 ? "F8FAFC" : "F1F5F9");
      cell.font = { color: { argb: `FF${COLORS.slate}` } };
      if (colorPriority && columnOffset === 0 && COLORS[value]) {
        cell.fill = solid(COLORS[value]);
        cell.font = { bold: true, color: { argb: `FF${COLORS.white}` } };
      }
    });
  });
}

function sparkBars(sheet, startRow, startColumn, rows, color) {
  const max = Math.max(1, ...rows.map(([, value]) => Number(value) || 0));
  rows.forEach(([label, value], rowOffset) => {
    sheet.getCell(startRow + rowOffset + 1, startColumn).value = label;
    const blocks = Math.max(1, Math.round((Number(value) / max) * 12));
    sheet.mergeCells(startRow + rowOffset + 1, startColumn + 1, startRow + rowOffset + 1, startColumn + 2);
    const cell = sheet.getCell(startRow + rowOffset + 1, startColumn + 1);
    cell.value = `${"■".repeat(blocks)} ${value}`;
    cell.font = { bold: true, color: { argb: `FF${color}` } };
  });
}

function styleHeader(row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.fill = solid(COLORS.navy);
    cell.font = { bold: true, color: { argb: `FF${COLORS.white}` } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

function solid(color) {
  return { type: "pattern", pattern: "solid", fgColor: { argb: `FF${color}` } };
}

function saveBlob(blob, fileName) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

function column(number) {
  let value = number;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}
