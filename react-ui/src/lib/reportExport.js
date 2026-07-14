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
  ["Exploit Available", "exploitAvailable", 17],
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
  ["Source Tools", "sourceDisplay", 34],
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

  if (analysis.dashboard?.unifiedInsights) await buildUnifiedDashboardSheet(workbook, analysis);
  if (isComparisonWorkflow(analysis)) await buildMonthlySheet(workbook, analysis);
  else await buildAdhocSheet(workbook, analysis);
  buildCustomerValueSheets(workbook, analysis);
  buildFindingsSheet(workbook, isComparisonWorkflow(analysis) ? analysis.currentFindings : analysis.findings);
  if ((analysis.sourceIds?.length ?? analysis.inputSummary?.sourceCount ?? 0) > 1) buildSourceAuditSheet(workbook, analysis);
  return workbook;
}

function buildCustomerValueSheets(workbook, analysis) {
  const insights = analysis.dashboard?.customerValueInsights;
  if (!insights) return;
  buildDecisionIntelligenceSheet(workbook, analysis, insights);
  buildRemediationCampaignSheet(workbook, analysis, insights.remediationCampaigns);
  if (insights.verification.available) buildRemediationVerificationSheet(workbook, analysis, insights.verification);
}

function buildDecisionIntelligenceSheet(workbook, analysis, insights) {
  const sheet = workbook.addWorksheet("Decision Intelligence", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const threat = insights.threatPriority;
  const quality = insights.dataQuality;
  prepareSheet(sheet, 12);
  [16, 25, 20, 18, 15, 18, 20, 18, 18, 16, 16, 18].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  title(sheet, "Threat Priority and Evidence Quality", analysis.dashboard?.reportRange ?? analysis.reportMonth ?? analysis.reportPeriod ?? "Current report", 12);
  kpi(sheet, "A4:C7", "THREAT REVIEW QUEUE", threat.reviewQueue, "P1-P4 remains unchanged", COLORS.critical);
  kpi(sheet, "D4:F7", "CISA KEV", threat.cisaKev, "Known exploited evidence", COLORS.high);
  kpi(sheet, "G4:I7", "EXPLOIT AVAILABLE", threat.exploitAvailable, "Scanner-provided signal", COLORS.medium);
  kpi(sheet, "J4:L7", "EPSS >= 50%", threat.epssAbove50, `${threat.epssObserved} with EPSS data`, "0891B2");

  section(sheet, "A9:E9", "Provisional SSVC Triage");
  writeTable(sheet, 10, 1, ["Decision", "Open Findings"], Object.entries(threat.ssvcCounts), true);
  section(sheet, "G9:L9", "SSVC Interpretation Boundary");
  writeTable(sheet, 10, 7, ["Available-Data Rule"], [...threat.ssvcMethodology, threat.contextNotice].map((line) => [line]));

  const queueStart = 17;
  section(sheet, `A${queueStart}:L${queueStart}`, "Threat-Priority Review Queue");
  writeTable(
    sheet,
    queueStart + 1,
    1,
    ["Patch Priority", "Asset", "Service", "Vulnerability", "CVE", "Severity", "Evidence", "Exposure", "Provisional SSVC"],
    threat.queue.map((row) => [row.priority, row.asset, row.service, row.vulnerability, row.cve || "N/A", row.severity, row.signals.join(" | "), row.exposure, row.ssvcDecision]),
    true,
  );

  const qualityStart = queueStart + Math.max(4, threat.queue.length) + 4;
  section(sheet, `A${qualityStart}:L${qualityStart}`, "Data Quality and Evidence Completeness");
  kpi(sheet, `A${qualityStart + 1}:C${qualityStart + 4}`, "EVIDENCE COMPLETENESS", `${quality.evidenceCompleteness}%`, "Eight normalized fields", COLORS.low);
  kpi(sheet, `D${qualityStart + 1}:F${qualityStart + 4}`, "CORE COMPLETE", quality.completeCore, `Of ${quality.totalFindings} findings`, "0891B2");
  kpi(sheet, `G${qualityStart + 1}:I${qualityStart + 4}`, "DATA GAP TYPES", quality.issues.length, "Missing fields disclosed", COLORS.medium);
  kpi(sheet, `J${qualityStart + 1}:L${qualityStart + 4}`, "STALE OBSERVATIONS", quality.staleObservations, ">30 days behind report", COLORS.critical);
  writeTable(
    sheet,
    qualityStart + 6,
    1,
    ["Normalized Field", "Present", "Missing", "Coverage %"],
    quality.completeness.map((row) => [row.label, row.present, row.missing, row.percent]),
  );
}

function buildRemediationCampaignSheet(workbook, analysis, data) {
  const sheet = workbook.addWorksheet("Remediation Campaigns", { views: [{ state: "frozen", ySplit: 9, showGridLines: false }] });
  prepareSheet(sheet, 12);
  [14, 32, 22, 18, 15, 15, 16, 16, 22, 45, 45, 20].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  title(sheet, "Remediation Campaign Dashboard", `${analysis.sourceLabel} | Grouped by vulnerability and remediation action`, 12);
  kpi(sheet, "A4:C7", "CAMPAIGNS", data.campaignCount, "Distinct action groups", COLORS.teal);
  kpi(sheet, "D4:F7", "MULTI-ASSET", data.multiAssetCampaigns, "One action, multiple assets", "0284C7");
  kpi(sheet, "G4:I7", "ACTION READY", data.actionReady, "Remediation text available", COLORS.low);
  kpi(sheet, "J4:L7", "REFERENCE READY", data.referenceReady, "KB or advisory available", COLORS.high);
  section(sheet, "A9:L9", "Prioritized Remediation Campaign Queue");
  writeTable(
    sheet,
    10,
    1,
    ["Priority", "Campaign", "CVE", "Findings", "Assets", "P1 + P2", "Exploit Available", "Sources", "Remediation Action", "References"],
    data.campaigns.map((campaign) => [
      campaign.primaryPriority,
      campaign.title,
      campaign.cve || "N/A",
      campaign.findingCount,
      campaign.assets.length,
      campaign.immediatePatch,
      campaign.exploitAvailable,
      campaign.sources.join(" | "),
      campaign.action || "Not provided by source export",
      campaign.references.join(" | ") || "Not provided by source export",
    ]),
    true,
  );
}

function buildRemediationVerificationSheet(workbook, analysis, verification) {
  const sheet = workbook.addWorksheet("Remediation Verification", { views: [{ state: "frozen", ySplit: 9, showGridLines: false }] });
  prepareSheet(sheet, 10);
  [14, 28, 24, 20, 14, 14, 16, 16, 18, 18].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  title(sheet, "Scan-to-Scan Remediation Verification", `${verification.previousPeriod} to ${verification.currentPeriod} | Scanner evidence, not patch-installation proof`, 10);
  kpi(sheet, "A4:B7", "PERSISTING", verification.persistent, `${verification.persistenceRate}% of previous open`, COLORS.high);
  kpi(sheet, "C4:D7", "NEW", verification.newFindings, `Added in ${verification.currentPeriod}`, "0284C7");
  kpi(sheet, "E4:F7", "REAPPEARED", verification.reappeared, "Seen before an absence", COLORS.critical);
  kpi(sheet, "G4:H7", "NOT OBSERVED", verification.noLongerObserved, "Requires closure evidence", COLORS.low);
  kpi(sheet, "I4:J7", "RECONCILED", verification.reconciled ? "YES" : "NO", `${verification.previousTotal} previous to ${verification.currentTotal} current`, verification.reconciled ? COLORS.low : COLORS.critical);
  section(sheet, "A9:J9", "Closure Evidence Candidates");
  writeTable(
    sheet,
    10,
    1,
    ["Priority", "Asset", "Service", "Vulnerability", "CVE", "Severity", "Count", "Exposure"],
    verification.closureCandidates.map((row) => [row.priority, row.asset, row.service, row.vulnerability, row.cve || "N/A", row.severity, row.count, row.exposure]),
    true,
  );
  const reappearedStart = 12 + Math.max(verification.closureCandidates.length, 3);
  section(sheet, `A${reappearedStart}:J${reappearedStart}`, "Reappeared Findings");
  writeTable(
    sheet,
    reappearedStart + 1,
    1,
    ["Priority", "Asset", "Service", "Vulnerability", "CVE", "Severity", "Count", "Exposure"],
    verification.reappearedFindings.map((row) => [row.priority, row.asset, row.service, row.vulnerability, row.cve || "N/A", row.severity, row.count, row.exposure]),
    true,
  );
}

async function buildUnifiedDashboardSheet(workbook, analysis) {
  const sheet = workbook.addWorksheet("Unified Dashboard", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const dashboard = analysis.dashboard;
  const insights = dashboard.unifiedInsights;
  const historical = (dashboard.unifiedTrend?.length ?? 0) > 1;
  const latestSummary = analysis.snapshots?.at(-1)?.inputSummary ?? analysis.inputSummary ?? {};
  const periodLabel = dashboard.reportRange ?? analysis.reportMonth ?? analysis.reportPeriod ?? "Current report";
  prepareSheet(sheet, 16);
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  sheet.getColumn(1).width = 28;
  sheet.getColumn(9).width = 32;
  sheet.getColumn(10).width = 20;
  title(sheet, "Unified Multi-Tool Combined Analysis", `${periodLabel} | ${analysis.sourceIds?.length ?? latestSummary.sourceCount ?? 0} selected scanner sources`, 16);

  kpi(sheet, "A4:D7", "CONSOLIDATED OPEN", insights.totalOpen, "Unique asset + vulnerability + service", COLORS.teal);
  kpi(sheet, "E4:H7", "AFFECTED ASSETS", insights.distinctAssets, "Unique consolidated assets", "0284C7");
  kpi(sheet, "I4:L7", "IMMEDIATE PATCH", insights.immediatePatch, "P1 + P2 findings", COLORS.critical);
  kpi(sheet, "M4:P7", "EXPLOIT AVAILABLE", insights.exploitAvailable, "Positive exploit evidence", COLORS.high);
  kpi(sheet, "A9:D12", "MULTI-SCANNER OVERLAP", insights.crossToolConfirmed, "Observed by two or more scanners", COLORS.low);
  kpi(sheet, "E9:H12", "SINGLE-SOURCE ONLY", insights.singleSourceOnly, "One-source validation queue", "0284C7");
  kpi(sheet, "I9:L12", "OVERLAP RATE", `${insights.confirmationRate}%`, "Multi-scanner overlap / open", "0891B2");
  kpi(sheet, "M9:P12", "REPEATS REMOVED", latestSummary.duplicatesRemoved ?? 0, "Repeated source observations", COLORS.high);

  let detailStartRow;
  if (historical) {
    section(sheet, "A14:P14", "Combined Portfolio Trend");
    writeTable(
      sheet,
      15,
      1,
      ["Period", "Total Open", "New", "Patched", "P1", "P2", "P3", "P4", "Multi-scanner Overlap", "Single-scanner", "Exploit Available", "Repeats Removed"],
      dashboard.unifiedTrend.map((row) => [row.period, row.totalOpen, row.newFindings, row.patchedFindings, row.P1, row.P2, row.P3, row.P4, row.crossToolConfirmed, row.singleSourceOnly, row.exploitable, row.repeatsRemoved]),
    );
    const chartRow = 17 + dashboard.unifiedTrend.length;
    await addMultiLineChartImage(
      workbook,
      sheet,
      [
        { name: "Total Open", color: "#DC2626", points: dashboard.unifiedTrend.map((row) => ({ label: row.period, value: row.totalOpen })) },
        { name: "New", color: "#0284C7", points: dashboard.unifiedTrend.map((row) => ({ label: row.period, value: row.newFindings })) },
        { name: "Patched", color: "#16A34A", points: dashboard.unifiedTrend.map((row) => ({ label: row.period, value: row.patchedFindings })) },
      ],
      "Combined Portfolio Movement",
      { col: 0.3, row: chartRow - 0.5, width: 610, height: 250 },
    );
    await addMultiLineChartImage(
      workbook,
      sheet,
      Object.entries(COLORS).filter(([key]) => /^P[1-4]$/.test(key)).map(([priority, color]) => ({
        name: priority,
        color: `#${color}`,
        points: dashboard.unifiedTrend.map((row) => ({ label: row.period, value: row[priority] })),
      })),
      "Patch Priority Movement",
      { col: 8.1, row: chartRow - 0.5, width: 610, height: 250 },
    );
    detailStartRow = chartRow + 14;
  } else {
    section(sheet, "A14:H14", "Detection Overlap by Scanner Count");
    writeTable(sheet, 15, 1, ["Scanner Count", "Open Findings"], insights.sourceAgreementDistribution.map((row) => [row.label, row.findingCount]));
    section(sheet, "I14:P14", "Combined Patch Priority Exposure");
    writeTable(sheet, 15, 9, ["Patch Priority", "Open Findings"], Object.entries(insights.patchPriorityCounts), true);
    const chartRow = 21;
    await addBarChartImage(workbook, sheet, insights.sourceAgreementDistribution.map((row) => ({ label: row.label, value: row.findingCount, color: "#16A34A" })), "Detection Overlap by Scanner Count", { col: 0.3, row: chartRow - 0.5, width: 610, height: 250 });
    await addBarChartImage(workbook, sheet, Object.entries(insights.patchPriorityCounts).map(([label, value]) => ({ label, value, color: `#${COLORS[label]}` })), "Combined Priority Exposure", { col: 8.1, row: chartRow - 0.5, width: 610, height: 250 });
    detailStartRow = chartRow + 14;
  }

  section(sheet, `A${detailStartRow}:G${detailStartRow}`, "Highest-Risk Assets");
  writeTable(
    sheet,
    detailStartRow + 1,
    1,
    ["Asset", "Open", "P1 + P2", "Critical", "Exploit Available", "Sources", "Exposure"],
    insights.topRiskAssets.map((row) => [row.asset, row.totalOpen, row.immediatePatch, row.critical, row.exploitAvailable, row.sourceCount, row.maxExposure]),
  );
  section(sheet, `I${detailStartRow}:P${detailStartRow}`, "Highest-Impact Vulnerabilities");
  writeTable(
    sheet,
    detailStartRow + 1,
    9,
    ["Vulnerability", "CVE", "Open", "Assets", "P1 + P2", "Exploit Available", "Sources", "Exposure"],
    insights.topVulnerabilities.map((row) => [row.vulnerability, row.cve || "N/A", row.totalOpen, row.affectedAssets, row.immediatePatch, row.exploitAvailable, row.sourceCount, row.maxExposure]),
  );

  const sourceStartRow = detailStartRow + Math.max(insights.topRiskAssets.length, insights.topVulnerabilities.length) + 3;
  section(sheet, `A${sourceStartRow}:H${sourceStartRow}`, "Scanner Contribution");
  writeTable(
    sheet,
    sourceStartRow + 1,
    1,
    ["Scanner", "Observed", "Assets", "P1 + P2", "Critical", "Exploit Available", "Multi-scanner Overlap", "Scanner-only"],
    (dashboard.sourceBreakdown ?? []).map((source) => [source.sourceLabel, source.openFindings, source.affectedAssets, source.immediatePatch, source.criticalFindings, source.exploitAvailable, source.crossToolConfirmed, source.exclusiveFindings]),
  );
  section(sheet, `J${sourceStartRow}:P${sourceStartRow}`, "Cross-Scanner Overlap");
  writeTable(sheet, sourceStartRow + 1, 10, ["Scanner Pair", "Overlapping Findings"], insights.sourcePairOverlap.map((row) => [row.sourcePair, row.findingCount]));
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
  sheet.getColumn(7).width = 24;
  sheet.getColumn(8).width = 16;
  sheet.getColumn(9).width = 20;
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
  sheet.getColumn(18).numFmt = "0";
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

function buildSourceAuditSheet(workbook, analysis) {
  const sheet = workbook.addWorksheet("Source Audit", { views: [{ state: "frozen", ySplit: 4, showGridLines: false }] });
  prepareSheet(sheet, 9);
  [24, 18, 18, 15, 15, 18, 22, 18, 14].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  title(sheet, "Unified Multi-Tool Source Audit", analysis.dashboard?.reportRange ?? analysis.reportMonth ?? analysis.reportPeriod ?? "Current report", 9);
  const summary = analysis.inputSummary ?? {};
  const latestSummary = analysis.snapshots?.at(-1)?.inputSummary ?? summary;
  kpi(sheet, "A4:B7", "INPUT FILES", summary.fileCount ?? 0, "All uploaded periods", "0284C7");
  kpi(sheet, "C4:D7", "SCANNER SOURCES", summary.sourceCount ?? analysis.sourceIds?.length ?? 0, "Selected and detected", COLORS.high);
  kpi(sheet, "E4:G7", "CONSOLIDATED OPEN", latestSummary.consolidatedOpenFindings ?? analysis.dashboard?.totalVulnerabilities ?? analysis.dashboard?.totalOpenVulnerabilities?.totalOpen ?? 0, "Latest/current report", COLORS.teal);
  kpi(sheet, "H4:I7", "REPEATS REMOVED", latestSummary.duplicatesRemoved ?? 0, "Latest/current report", COLORS.critical);

  section(sheet, "A9:I9", "Per-Source Coverage");
  const sourceRows = (analysis.dashboard?.sourceBreakdown ?? []).map((source) => [
    source.sourceLabel,
    source.openFindings,
    source.affectedAssets,
    source.immediatePatch,
    source.criticalFindings,
    source.exploitAvailable,
    source.crossToolConfirmed,
    source.exclusiveFindings,
  ]);
  writeTable(sheet, 10, 1, ["Scanner Source", "Observed Findings", "Affected Assets", "P1 + P2", "Critical", "Exploit Available", "Multi-scanner Overlap", "Scanner-only"], sourceRows, true);

  if ((analysis.dashboard?.sourceTrend?.length ?? 0) > 1) {
    section(sheet, "A18:I18", "Historical Consolidation Audit");
    writeTable(
      sheet,
      19,
      1,
      ["Period", "Open", "P1 + P2", "Exploit Available", "Multi-scanner Overlap", "Single-scanner", "Repeats Removed"],
      analysis.dashboard.sourceTrend.map((row) => [row.period, row.totalOpen, row.immediatePatch, row.exploitable, row.crossToolConfirmed, row.singleSourceOnly, row.duplicatesRemoved]),
      true,
    );
  }
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
  valueCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.mergeCells(endCell.row, startCell.col, endCell.row, endCell.col);
  const helperCell = sheet.getCell(endCell.row, startCell.col);
  helperCell.value = helper;
  helperCell.fill = solid("F8FAFC");
  helperCell.font = { size: 9, color: { argb: `FF${COLORS.slate}` } };
  helperCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
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
    cell.font = { bold: true, size: 9, color: { argb: `FF${COLORS.white}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  sheet.getRow(startRow).height = 30;
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
  if (key === "sourceDisplay") return finding.sourceDisplay || (finding.sourceTools ?? []).join(" + ") || finding.sourceTool;
  const value = finding[key];
  if (value !== undefined && value !== null && value !== "") return value;
  if (key === "firstDiscovered" || key === "lastObserved") return "Not provided by source export";
  return "N/A";
}

async function addLineChartImage(workbook, sheet, points, chartTitle, color, placement) {
  if (!canRenderChartImages()) return;
  const image = await renderLineChartPng(points, chartTitle, color);
  const imageId = workbook.addImage({ base64: image, extension: "png" });
  sheet.addImage(imageId, {
    tl: { col: placement.col, row: placement.row },
    ext: { width: placement.width, height: placement.height },
    editAs: "oneCell",
  });
}

async function addMultiLineChartImage(workbook, sheet, series, chartTitle, placement) {
  if (!canRenderChartImages() || !series.length) return;
  const image = await renderMultiLineChartPng(series, chartTitle);
  const imageId = workbook.addImage({ base64: image, extension: "png" });
  sheet.addImage(imageId, { tl: { col: placement.col, row: placement.row }, ext: { width: placement.width, height: placement.height }, editAs: "oneCell" });
}

async function addBarChartImage(workbook, sheet, points, chartTitle, placement) {
  if (!canRenderChartImages() || !points.length) return;
  const image = await renderBarChartPng(points, chartTitle);
  const imageId = workbook.addImage({ base64: image, extension: "png" });
  sheet.addImage(imageId, { tl: { col: placement.col, row: placement.row }, ext: { width: placement.width, height: placement.height }, editAs: "oneCell" });
}

function canRenderChartImages() {
  return typeof document !== "undefined" && typeof Image !== "undefined" && typeof URL?.createObjectURL === "function";
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
  return renderSvgPng(svg, width, height, chartTitle);
}

async function renderMultiLineChartPng(series, chartTitle) {
  const width = 900;
  const height = 360;
  const plot = { left: 72, top: 78, right: 48, bottom: 64 };
  const chartWidth = width - plot.left - plot.right;
  const chartHeight = height - plot.top - plot.bottom;
  const labels = series[0].points.map((point) => point.label);
  const values = series.flatMap((item) => item.points.map((point) => Math.max(0, Number(point.value) || 0)));
  const axisMax = Math.max(5, Math.ceil(Math.max(1, ...values) / 5) * 5);
  const xFor = (index) => plot.left + (labels.length <= 1 ? chartWidth / 2 : (index / (labels.length - 1)) * chartWidth);
  const yFor = (value) => plot.top + chartHeight - (value / axisMax) * chartHeight;
  const grid = chartGridSvg({ axisMax, yFor, left: plot.left, right: width - plot.right });
  const xLabels = labels.map((label, index) => `<text x="${xFor(index)}" y="${height - 22}" text-anchor="middle" font-size="15" font-weight="600" fill="#475569">${escapeXml(label)}</text>`).join("");
  const lines = series.map((item) => {
    const points = item.points.map((point, index) => `${xFor(index)},${yFor(Math.max(0, Number(point.value) || 0))}`).join(" ");
    const dots = item.points.map((point, index) => `<circle cx="${xFor(index)}" cy="${yFor(Math.max(0, Number(point.value) || 0))}" r="5" fill="#FFFFFF" stroke="${item.color}" stroke-width="4"/>`).join("");
    return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
  }).join("");
  const legend = series.map((item, index) => `<rect x="${plot.left + index * 150}" y="48" width="18" height="5" rx="2" fill="${item.color}"/><text x="${plot.left + 26 + index * 150}" y="55" font-size="14" font-weight="700" fill="#475569">${escapeXml(item.name)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" rx="18" fill="#FFFFFF"/><text x="${width / 2}" y="30" text-anchor="middle" font-family="Aptos,Segoe UI,sans-serif" font-size="24" font-weight="700" fill="#172033">${escapeXml(chartTitle)}</text><g font-family="Aptos,Segoe UI,sans-serif">${legend}${grid}${xLabels}${lines}</g></svg>`;
  return renderSvgPng(svg, width, height, chartTitle);
}

async function renderBarChartPng(points, chartTitle) {
  const width = 900;
  const height = 360;
  const plot = { left: 72, top: 70, right: 48, bottom: 64 };
  const chartWidth = width - plot.left - plot.right;
  const chartHeight = height - plot.top - plot.bottom;
  const values = points.map((point) => Math.max(0, Number(point.value) || 0));
  const axisMax = Math.max(5, Math.ceil(Math.max(1, ...values) / 5) * 5);
  const yFor = (value) => plot.top + chartHeight - (value / axisMax) * chartHeight;
  const slot = chartWidth / Math.max(points.length, 1);
  const barWidth = Math.min(90, slot * 0.56);
  const grid = chartGridSvg({ axisMax, yFor, left: plot.left, right: width - plot.right });
  const bars = points.map((point, index) => {
    const value = values[index];
    const x = plot.left + slot * index + (slot - barWidth) / 2;
    const y = yFor(value);
    const barHeight = plot.top + chartHeight - y;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="${point.color}"/><text x="${x + barWidth / 2}" y="${Math.max(plot.top + 15, y - 10)}" text-anchor="middle" font-size="17" font-weight="700" fill="#334155">${value}</text><text x="${x + barWidth / 2}" y="${height - 22}" text-anchor="middle" font-size="15" font-weight="600" fill="#475569">${escapeXml(point.label)}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" rx="18" fill="#FFFFFF"/><text x="${width / 2}" y="34" text-anchor="middle" font-family="Aptos,Segoe UI,sans-serif" font-size="24" font-weight="700" fill="#172033">${escapeXml(chartTitle)}</text><g font-family="Aptos,Segoe UI,sans-serif">${grid}${bars}</g></svg>`;
  return renderSvgPng(svg, width, height, chartTitle);
}

function chartGridSvg({ axisMax, yFor, left, right }) {
  return Array.from({ length: 6 }, (_, index) => {
    const value = Math.round((axisMax * index) / 5);
    const y = yFor(value);
    return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#D7DEE8" stroke-width="1" stroke-dasharray="5 5"/><text x="${left - 14}" y="${y + 5}" text-anchor="end" font-size="15" fill="#64748B">${value}</text>`;
  }).join("");
}

async function renderSvgPng(svg, width, height, chartTitle) {
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
