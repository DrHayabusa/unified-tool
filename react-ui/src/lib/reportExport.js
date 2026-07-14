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
  if (!analysis) throw new Error("Analyze an export before generating the Excel report.");
  const workbook = await buildAnalysisWorkbook(analysis);
  const buffer = await workbook.xlsx.writeBuffer();
  const suffix = isComparisonWorkflow(analysis)
    ? (analysis.dashboard.uploadedPeriods ?? analysis.dashboard.uploadedMonths).at(-1).replaceAll(" ", "_")
    : analysis.workflow === "quarterly-scan" ? "Quarterly_3_Month" : "Adhoc";
  saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `MVA_${safeName(analysis.sourceLabel)}_${suffix}_Report.xlsx`);
}

export async function buildAnalysisWorkbook(analysis) {
  if (!analysis) throw new Error("Analyze an export before generating the Excel report.");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MVA Unified Agent";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `${analysis.sourceLabel} vulnerability report`;

  if (isComparisonWorkflow(analysis)) await buildMonthlySheet(workbook, analysis);
  else await buildAdhocSheet(workbook, analysis);
  buildFindingsSheet(workbook, isComparisonWorkflow(analysis) ? analysis.currentFindings : analysis.findings);
  return workbook;
}

export function downloadNormalizedCsv(analysis) {
  if (!analysis) throw new Error("Analyze an export before downloading normalized findings.");
  const findings = isComparisonWorkflow(analysis) ? analysis.currentFindings : analysis.findings;
  const rows = [FINDING_COLUMNS.map(([header]) => header)];
  for (const finding of findings) {
    rows.push(FINDING_COLUMNS.map(([, key]) => key === "exploitAvailable" ? (finding[key] ? "Yes" : "No") : finding[key] ?? ""));
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  saveBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `MVA_${safeName(analysis.sourceLabel)}_Normalized_Findings.csv`);
}

async function buildMonthlySheet(workbook, analysis) {
  const quarterly = analysis.workflow === "quarterly";
  const singular = quarterly ? "Quarter" : "Month";
  const plural = quarterly ? "Quarters" : "Months";
  const sheet = workbook.addWorksheet(`${singular}ly Report`, { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const dashboard = analysis.dashboard;
  const open = dashboard.totalOpenVulnerabilities;
  const patched = dashboard.totalVulnerabilitiesPatchedLastPeriod ?? dashboard.totalVulnerabilitiesPatchedLastMonth;
  prepareSheet(sheet, 12);
  title(sheet, `${reportSourceLabel(analysis.sourceLabel)} ${singular}ly Vulnerability Report`, dashboard.reportRange, 12);

  kpi(sheet, "A4:C7", "TOTAL OPEN", open.totalOpen, "New + not closed", COLORS.teal);
  kpi(sheet, "D4:F7", `NEW THIS ${singular.toUpperCase()}`, open.newVulnerabilities, "Identified in current report", "0284C7");
  kpi(sheet, "G4:I7", "NOT CLOSED", open.notClosedFromPreviousMonths, "Carried from previous report", COLORS.high);
  kpi(sheet, "J4:L7", `PATCHED LAST ${singular.toUpperCase()}`, patched.patchedCount, `${patched.previousPeriod} to ${patched.currentPeriod}`, COLORS.low);

  const discoveredTrend = (dashboard.trendDiscoveredLast3Periods ?? dashboard.trendDiscoveredLast3Months).map((row) => ({ label: row.period ?? row.month, value: row.discoveredCount }));
  const remediatedTrend = (dashboard.trendRemediatedLast3Periods ?? dashboard.trendRemediatedLast3Months).map((row) => ({ label: row.period ?? row.month, value: row.remediatedCount }));
  section(sheet, "A9:C9", `Vulnerability Trend - Last 3 ${plural}`);
  writeTable(
    sheet,
    10,
    1,
    [singular, "Discovered", "Remediated"],
    discoveredTrend.map((row, index) => [row.label, row.value, remediatedTrend[index]?.value ?? 0]),
  );
  await addLineChartImage(workbook, sheet, discoveredTrend, "Vulnerabilities Discovered", "#2563EB", { col: 3, row: 8, width: 490, height: 220 });
  await addLineChartImage(workbook, sheet, remediatedTrend, "Vulnerabilities Remediated", "#16A34A", { col: 8, row: 8, width: 390, height: 220 });

  section(sheet, "A21:L21", "Total Open by Patch Priority");
  ["P1", "P2", "P3", "P4"].forEach((priority, index) => {
    const start = 1 + index * 3;
    kpi(sheet, `${column(start)}22:${column(start + 2)}25`, priority, dashboard.totalOpenByPatchPriority[priority], "Open findings", COLORS[priority]);
  });

  section(sheet, "A27:F27", "Total Open by Age and Patch Priority");
  writeTable(
    sheet,
    28,
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

  section(sheet, "G27:L27", `Vulnerabilities Patched in Last ${singular}`);
  writeTable(sheet, 28, 7, ["Measure", "Count", `Report ${singular}`], [
    [`Previous ${singular} Open`, patched.previousPeriodOpen, patched.previousPeriod],
    [`New This ${singular}`, patched.newVulnerabilitiesIdentifiedThisPeriod, patched.currentPeriod],
    [`Current ${singular} Open`, patched.currentPeriodOpen, patched.currentPeriod],
    [`Patched Last ${singular}`, patched.patchedCount, patched.currentPeriod],
  ]);

  section(sheet, "A35:L35", `Uploaded ${singular} Summary`);
  writeTable(
    sheet,
    36,
    1,
    [singular, "Critical", "High", "Medium", "Low", "Total Open", "New", "Patched"],
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
    section(sheet, "A44:L44", "CrowdStrike Exposure Signals");
    const insight = dashboard.crowdstrikeInsights;
    kpi(sheet, "A45:C48", "EXPLOIT AVAILABLE", insight.exploitAvailable, "Known exploit signal", COLORS.high);
    kpi(sheet, "D45:F48", "CISA KEV", insight.cisaKev, "Cataloged exploited CVEs", COLORS.critical);
    kpi(sheet, "G45:I48", "INTERNET EXPOSED", insight.internetExposed, "Open findings", "0891B2");
    kpi(sheet, "J45:L48", "CRITICAL ASSETS", insight.criticalAssets, "Distinct assets", "7C3AED");
  }
}

function isComparisonWorkflow(analysis) {
  return analysis?.workflow === "monthly" || analysis?.workflow === "quarterly";
}

async function buildAdhocSheet(workbook, analysis) {
  const quarterly = analysis.workflow === "quarterly-scan";
  const sheet = workbook.addWorksheet(quarterly ? "Quarterly Report" : "Adhoc Report", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const dashboard = analysis.dashboard;
  prepareSheet(sheet, 12);
  title(sheet, `${reportSourceLabel(analysis.sourceLabel)} ${quarterly ? "Quarterly 3-Month" : "Adhoc"} Vulnerability Report`, `${quarterly ? `${analysis.reportPeriod} | ` : ""}${analysis.exportType} | ${analysis.fileName}`, 12);
  kpi(sheet, "A4:C7", "TOTAL VULNERABILITIES", dashboard.totalVulnerabilities, "Open findings", COLORS.teal);
  kpi(sheet, "D4:F7", "DISTINCT ASSETS", dashboard.distinctAssets, "Affected assets", "0284C7");
  kpi(sheet, "G4:I7", "EXPLOIT AVAILABLE", dashboard.exploitAvailable, "Known exploit signal", COLORS.high);
  kpi(sheet, "J4:L7", "IMMEDIATE PATCH", (dashboard.patchPriorityCounts.P1 ?? 0) + (dashboard.patchPriorityCounts.P2 ?? 0), "P1 + P2", COLORS.critical);

  section(sheet, "A9:F9", "Severity Distribution");
  writeTable(sheet, 10, 1, ["Severity", "Count"], Object.entries(dashboard.severityCounts));
  section(sheet, "G9:L9", "Patch Priority Distribution");
  writeTable(sheet, 10, 7, ["Patch Priority", "Count"], Object.entries(dashboard.patchPriorityCounts), true);

  section(sheet, "A19:F19", "Top 10 Affected Assets");
  const affectedAssets = dashboard.top10AffectedAssets.map((row) => [row.asset, row.vulnerabilityCount]);
  writeAffectedAssetsTable(sheet, 20, affectedAssets);
  section(sheet, "G19:L19", "Affected Asset Concentration");
  writeAssetConcentration(sheet, 20, affectedAssets, COLORS.critical);

  if (quarterly) {
    section(sheet, "A32:L32", "Vulnerabilities Discovered - Last 3 Months");
    await addLineChartImage(
      workbook,
      sheet,
      dashboard.quarterlyDiscoveryTrend.map((row) => ({ label: row.month, value: row.discoveredCount })),
      "Vulnerabilities Discovered - Last 3 Months",
      "#DC2626",
      { col: 0.5, row: 32.5, width: 720, height: 288 },
    );
  }
}

function buildFindingsSheet(workbook, findings) {
  const sheet = workbook.addWorksheet("Report Data", { views: [{ state: "frozen", ySplit: 1, xSplit: 2, showGridLines: false }] });
  sheet.columns = FINDING_COLUMNS.map(([header, key, width]) => ({ header, key, width }));
  const rows = findings.map((finding) => Object.fromEntries(FINDING_COLUMNS.map(([, key]) => [key, findingCellValue(finding, key)])));
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

function reportSourceLabel(sourceLabel) {
  return String(sourceLabel ?? "MVA").replace(/\s+Monthly$/i, "").replace(/\s+Adhoc$/i, "");
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

function writeAffectedAssetsTable(sheet, startRow, rows) {
  sheet.mergeCells(startRow, 1, startRow, 5);
  tableHeaderCell(sheet.getCell(startRow, 1), "Asset");
  tableHeaderCell(sheet.getCell(startRow, 6), "Count");

  rows.forEach(([asset, value], rowOffset) => {
    const row = startRow + rowOffset + 1;
    sheet.mergeCells(row, 1, row, 5);
    const assetCell = sheet.getCell(row, 1);
    assetCell.value = asset;
    assetCell.alignment = { vertical: "middle", shrinkToFit: true };
    assetCell.fill = solid(rowOffset % 2 === 0 ? "F8FAFC" : "F1F5F9");
    assetCell.font = { color: { argb: `FF${COLORS.slate}` } };

    const countCell = sheet.getCell(row, 6);
    countCell.value = value;
    countCell.alignment = { horizontal: "center", vertical: "middle" };
    countCell.fill = solid(rowOffset % 2 === 0 ? "F8FAFC" : "F1F5F9");
    countCell.font = { bold: true, color: { argb: `FF${COLORS.navy}` } };
  });
}

function writeAssetConcentration(sheet, startRow, rows, color) {
  sheet.mergeCells(startRow, 7, startRow, 9);
  tableHeaderCell(sheet.getCell(startRow, 7), "Asset");
  sheet.mergeCells(startRow, 10, startRow, 12);
  tableHeaderCell(sheet.getCell(startRow, 10), "Relative concentration");

  const max = Math.max(1, ...rows.map(([, value]) => Number(value) || 0));
  rows.forEach(([label, value], rowOffset) => {
    const row = startRow + rowOffset + 1;
    sheet.mergeCells(row, 7, row, 9);
    const labelCell = sheet.getCell(row, 7);
    labelCell.value = label;
    labelCell.alignment = { vertical: "middle", shrinkToFit: true };
    labelCell.fill = solid(rowOffset % 2 === 0 ? "F8FAFC" : "F1F5F9");
    labelCell.font = { color: { argb: `FF${COLORS.slate}` } };

    const blocks = Math.max(1, Math.round((Number(value) / max) * 12));
    sheet.mergeCells(row, 10, row, 12);
    const cell = sheet.getCell(row, 10);
    cell.value = `${"■".repeat(blocks)} ${value}`;
    cell.alignment = { vertical: "middle", shrinkToFit: true };
    cell.fill = solid(rowOffset % 2 === 0 ? "F8FAFC" : "F1F5F9");
    cell.font = { bold: true, color: { argb: `FF${color}` } };
  });
}

function tableHeaderCell(cell, value) {
  cell.value = value;
  cell.fill = solid(COLORS.navy);
  cell.font = { bold: true, color: { argb: `FF${COLORS.white}` } };
  cell.alignment = { vertical: "middle" };
}

function findingCellValue(finding, key) {
  if (key === "exploitAvailable") return finding[key] ? "Yes" : "No";
  const value = finding[key];
  if (value !== undefined && value !== null && value !== "") return value;
  if (key === "firstDiscovered" || key === "lastObserved") return "Not provided by source export";
  return "N/A";
}

async function addLineChartImage(workbook, sheet, points, chartTitle, color, placement) {
  const image = await renderLineChartPng(points, chartTitle, color);
  const imageId = workbook.addImage({ base64: image, extension: "png" });
  sheet.addImage(imageId, {
    tl: { col: placement.col, row: placement.row },
    ext: { width: placement.width, height: placement.height },
    editAs: "oneCell",
  });
}

async function renderLineChartPng(points, chartTitle, color) {
  const width = 900;
  const height = 360;
  const plot = { left: 72, top: 74, right: 72, bottom: 58 };
  const chartWidth = width - plot.left - plot.right;
  const chartHeight = height - plot.top - plot.bottom;
  const values = points.map((point) => Math.max(0, Number(point.value) || 0));
  const maxValue = Math.max(1, ...values);
  const axisMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const xFor = (index) => plot.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const yFor = (value) => plot.top + chartHeight - (value / axisMax) * chartHeight;
  const grid = Array.from({ length: 6 }, (_, index) => {
    const value = Math.round((axisMax * index) / 5);
    const y = yFor(value);
    return `<line x1="${plot.left}" y1="${y}" x2="${width - plot.right}" y2="${y}" stroke="#D7DEE8" stroke-width="1" stroke-dasharray="5 5"/><text x="${plot.left - 14}" y="${y + 5}" text-anchor="end" font-size="17" fill="#64748B">${value}</text>`;
  }).join("");
  const labels = points.map((point, index) => `<text x="${xFor(index)}" y="${height - 22}" text-anchor="middle" font-size="17" font-weight="600" fill="#475569">${escapeXml(point.label)}</text>`).join("");
  const coordinates = points.map((point, index) => `${xFor(index)},${yFor(values[index])}`).join(" ");
  const dots = points.map((point, index) => `<circle cx="${xFor(index)}" cy="${yFor(values[index])}" r="7" fill="#FFFFFF" stroke="${color}" stroke-width="5"/><text x="${xFor(index)}" y="${yFor(values[index]) - 15}" text-anchor="middle" font-size="17" font-weight="700" fill="#334155">${values[index]}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" rx="18" fill="#FFFFFF"/><text x="${width / 2}" y="38" text-anchor="middle" font-family="Aptos,Segoe UI,sans-serif" font-size="26" font-weight="700" fill="#172033">${escapeXml(chartTitle)}</text><g font-family="Aptos,Segoe UI,sans-serif">${grid}${labels}<polyline points="${coordinates}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>${dots}</g></svg>`;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Could not render ${chartTitle}.`));
      image.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
