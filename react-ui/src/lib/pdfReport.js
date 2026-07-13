export function buildRemediationPrompt({ analysis, targetMonth }) {
  const findings = groupedPrioritizedFindings(analysis, targetMonth).slice(0, 60).map((group) => ({
    affectedFindings: group.affectedCount,
    affectedAssets: group.assets,
    vulnerabilityName: group.finding.vulnerabilityName,
    cve: group.finding.cve || "N/A",
    severity: group.finding.severity,
    exploitAvailability: group.finding.exploitAvailable ? "Available" : "No known exploit",
    patchPriority: group.finding.patchPriority,
    product: group.finding.product || group.finding.platformDetails,
    remediation: dedupeSegments(group.finding.remediation),
    advisoryLinks: group.links,
  }));
  const dashboard = analysis?.dashboard ?? {};
  const summary = analysis?.workflow === "monthly"
    ? {
        totalOpen: dashboard.totalOpenVulnerabilities?.totalOpen,
        newThisMonth: dashboard.totalOpenVulnerabilities?.newVulnerabilities,
        patchedLastMonth: dashboard.totalVulnerabilitiesPatchedLastMonth?.patchedCount,
        patchPriority: dashboard.totalOpenByPatchPriority,
      }
    : {
        totalOpen: dashboard.totalVulnerabilities,
        patchPriority: dashboard.patchPriorityCounts,
        severity: dashboard.severityCounts,
      };

  return `You are the MVA Remediation Guide generation engine. Return customer-ready Markdown only.

Create an industry-standard document with this exact document identity:
- Title: Remediation Guide
- Report Type: Remediation
- Tool Source: ${analysis?.sourceLabel || "MVA"}
- Reporting Month: ${targetMonth}
- Do not include a customer name, purpose section, created-by line, or internal implementation wording.

Required structure:
1. A clean Contents section.
2. Report Summary with only actionable counts and priorities.
3. Remediation Actions ordered P1, P2, P3, then P4.
4. Group repeated findings by CVE or vulnerability name. For every action include affected finding count, example assets, CVE, severity, patch priority, reference links, prerequisites, numbered remediation steps, command examples, rollback, and validation.
5. Put every command in a fenced code block with a language tag (bash, powershell, sql, or text).
6. Use only commands supported by the supplied remediation text or authoritative link context. Use explicit placeholders where exact product paths or versions are unknown.
7. End with Validation Requirements and a Reference Appendix.
8. Do not invent patch versions, KB numbers, CVEs, links, or successful validation evidence.

Dashboard summary:
${JSON.stringify(summary, null, 2)}

Prioritized normalized findings:
${JSON.stringify(findings, null, 2)}
`;
}

export function buildTemplateMarkdown({ analysis, targetMonth }) {
  const groups = groupedPrioritizedFindings(analysis, targetMonth).slice(0, 20);
  const dashboard = analysis?.dashboard ?? {};
  const total = analysis?.workflow === "monthly" ? dashboard.totalOpenVulnerabilities?.totalOpen : dashboard.totalVulnerabilities;
  const lines = [
    "# Remediation Guide",
    "",
    "## Contents",
    "",
    "1. Report Summary",
    "2. Remediation Actions",
    "3. Validation Requirements",
    "4. Reference Appendix",
    "",
    "## 1. Report Summary",
    "",
    `Tool Source: ${analysis?.sourceLabel || "MVA"}`,
    `Reporting Month: ${targetMonth}`,
    `Total Open Findings: ${total ?? 0}`,
    "",
    "## 2. Remediation Actions",
  ];
  groups.forEach((group, index) => {
    const finding = group.finding;
    const commands = commandForFinding(finding);
    lines.push(
      "",
      `### ${index + 1}. ${finding.vulnerabilityName || "Recommended Remediation"}`,
      "",
      `- Affected Findings: ${group.affectedCount} across ${group.assets.length} assets`,
      `- Asset Examples: ${group.assets.slice(0, 5).join(", ") || "Not provided"}`,
      `- CVE: ${finding.cve || "N/A"}`,
      `- Severity: ${finding.severity}`,
      `- Patch Priority: ${finding.patchPriority}`,
      ...group.links.map((link) => `- Advisory: ${link}`),
      "",
      "Remediation steps:",
      "",
      `1. ${dedupeSegments(finding.remediation) || "Review the vendor advisory and apply the supported security update."}`,
      "2. Validate application and service health after the change.",
      "3. Run a follow-up vulnerability scan and retain evidence.",
      "",
      `\`\`\`${commands.language}`,
      ...commands.lines,
      "```",
    );
  });
  lines.push(
    "",
    "## 3. Validation Requirements",
    "",
    "Confirm service health, review change evidence, and verify closure in a follow-up vulnerability scan.",
    "",
    "## 4. Reference Appendix",
    "",
    ...[...new Set(groups.flatMap((group) => group.links))].map((link) => `- ${link}`),
  );
  return lines.join("\n");
}

export async function downloadRemediationPdf({ markdown, sourceLabel, targetMonth }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: "Remediation Guide",
    subject: `${sourceLabel || "MVA"} vulnerability remediation plan for ${targetMonth || "the selected reporting period"}`,
    creator: "MVA Vulnerability Agent",
  });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 18;

  doc.setFillColor(20, 33, 61);
  doc.rect(0, 0, width, 54, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.text("Remediation Guide", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Vulnerability remediation plan", margin, 42);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  metadataRow(doc, "Report Type", "Remediation", margin, 74, width - margin * 2);
  metadataRow(doc, "Tool Source", sourceLabel || "MVA", margin, 87, width - margin * 2);
  metadataRow(doc, "Reporting Month", targetMonth || "Not provided", margin, 100, width - margin * 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Contents", margin, 126);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const contents = extractHeadings(markdown).filter((heading) => heading.level === 2).slice(0, 10);
  let contentsY = 137;
  contents.forEach((heading, index) => {
    doc.text(`${index + 1}. ${heading.text.replace(/^\d+\.\s*/, "")}`, margin + 2, contentsY);
    contentsY += 8;
  });

  doc.addPage();
  renderMarkdown(doc, markdown, { margin, width, height });
  addFooters(doc, margin, width, height);
  doc.save(`MVA_${safeName(sourceLabel)}_${safeName(targetMonth)}_Remediation_Guide.pdf`);
}

function renderMarkdown(doc, markdown, { margin, width, height }) {
  const lines = String(markdown || "").replace(/\r/g, "").split("\n");
  let y = 22;
  let codeLines = [];
  let inCode = false;

  const ensureSpace = (needed) => {
    if (y + needed <= height - 18) return;
    doc.addPage();
    y = 22;
  };

  const renderCode = () => {
    if (!codeLines.length) return;
    const wrapped = codeLines.flatMap((line) => doc.splitTextToSize(line || " ", width - margin * 2 - 10));
    const boxHeight = Math.max(14, wrapped.length * 4.2 + 8);
    ensureSpace(boxHeight + 5);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, width - margin * 2, boxHeight, 2, 2, "F");
    doc.setTextColor(226, 232, 240);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(wrapped, margin + 5, y + 6);
    y += boxHeight + 5;
    codeLines = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    if (line.startsWith("```")) {
      if (inCode) renderCode();
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(rawLine);
      return;
    }
    if (!line.trim()) {
      y += 3;
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = cleanMarkdown(heading[2]);
      const size = level === 1 ? 19 : level === 2 ? 15 : level === 3 ? 12 : 10;
      ensureSpace(size + 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(level <= 2 ? 15 : 7, level <= 2 ? 23 : 89, level <= 2 ? 42 : 133);
      const wrapped = doc.splitTextToSize(text, width - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * (size * 0.43) + 4;
      return;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    const prefix = bullet ? "- " : numbered ? `${line.match(/^\d+/)[0]}. ` : "";
    const body = cleanMarkdown(bullet?.[1] ?? numbered?.[1] ?? line);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const wrapped = doc.splitTextToSize(`${prefix}${body}`, width - margin * 2 - (prefix ? 4 : 0));
    ensureSpace(wrapped.length * 4.5 + 3);
    const textX = margin + (prefix ? 2 : 0);
    doc.text(wrapped, textX, y);
    const url = body.match(/https?:\/\/[^\s)]+/)?.[0];
    if (url) {
      wrapped.forEach((wrappedLine, index) => {
        doc.link(textX, y - 3 + index * 4.5, Math.min(doc.getTextWidth(wrappedLine), width - margin * 2), 4.5, { url });
      });
    }
    y += wrapped.length * 4.5 + 2;
  });
  if (inCode || codeLines.length) renderCode();
}

function metadataRow(doc, label, value, x, y, width) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, y - 8, width, 10, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.text(label, x + 4, y - 2);
  doc.setFont("helvetica", "normal");
  doc.text(String(value), x + 46, y - 2);
}

function addFooters(doc, margin, width, height) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, height - 14, width - margin, height - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Remediation Guide", margin, height - 8);
    doc.text(`Page ${page} of ${pages}`, width - margin, height - 8, { align: "right" });
  }
}

function prioritizedFindings(analysis, targetMonth) {
  const selectedSnapshot = analysis?.workflow === "monthly" ? analysis.snapshots?.find((snapshot) => snapshot.month === targetMonth) : null;
  const findings = selectedSnapshot?.findings ?? (analysis?.workflow === "monthly" ? analysis.currentFindings : analysis?.findings ?? []);
  return [...findings].sort((left, right) => priorityRank(left.patchPriority) - priorityRank(right.patchPriority) || right.assetExposure - left.assetExposure);
}

function groupedPrioritizedFindings(analysis, targetMonth) {
  const groups = new Map();
  prioritizedFindings(analysis, targetMonth).forEach((finding) => {
    const key = String(finding.cve || finding.vulnerabilityName || finding.sourceVulnerabilityId || finding.findingKey).trim().toUpperCase();
    if (!groups.has(key)) {
      groups.set(key, { finding, affectedCount: 0, assets: new Set(), links: new Set() });
    }
    const group = groups.get(key);
    group.affectedCount += Number(finding.recordCount) || 1;
    const asset = finding.dnsName || finding.ipAddress;
    if (asset) group.assets.add(asset);
    uniqueLinks(finding.kbLinks).forEach((link) => group.links.add(link));
  });
  return [...groups.values()].map((group) => ({
    finding: group.finding,
    affectedCount: group.affectedCount,
    assets: [...group.assets].sort(),
    links: [...group.links],
  }));
}

function uniqueLinks(value) {
  return [...new Set(String(value || "").replace(/,/g, "|").split("|").map((part) => part.trim()).filter((part) => /^https?:\/\//i.test(part)))];
}

function dedupeSegments(value) {
  const seen = new Set();
  return String(value || "").split("|").map((part) => part.trim().replace(/\s+/g, " ")).filter((part) => {
    const key = part.toLowerCase();
    if (!part || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(" ");
}

function commandForFinding(finding) {
  const name = String(finding.vulnerabilityName || "").toLowerCase();
  if (name.includes("chrome")) return { language: "powershell", lines: ["winget upgrade --id Google.Chrome --exact --silent --accept-source-agreements --accept-package-agreements", "(Get-Item 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe').VersionInfo.FileVersion"] };
  if (name.includes("remote desktop")) return { language: "powershell", lines: ["Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10", "# Install the approved Microsoft security update and reboot if required", "Get-Service TermServLicensing"] };
  if (name.includes("log4j")) return { language: "bash", lines: ["find /opt -name 'log4j-core-*.jar' -print", "# Replace the vulnerable JAR through the approved application release", "sudo systemctl restart <affected-service>"] };
  if (name.includes("tomcat")) return { language: "bash", lines: ["/opt/tomcat/bin/version.sh", "grep -n 'Connector.*AJP' /opt/tomcat/conf/server.xml", "# Upgrade Tomcat and disable unused AJP or require a secret", "sudo systemctl restart tomcat"] };
  if (name.includes("openssl")) return { language: "bash", lines: ["openssl version -a", "sudo apt-get update", "sudo apt-get install --only-upgrade openssl", "sudo systemctl restart <affected-service>"] };
  if (name.includes("linux kernel")) return { language: "bash", lines: ["uname -r", "sudo apt-get update", "sudo apt-get install --only-upgrade linux-image-generic", "sudo reboot"] };
  if (name.includes("cisco ios xe")) return { language: "text", lines: ["show version", "show running-config | include ^ip http", "# Stage and activate the vendor-fixed IOS XE image under the approved network change"] };
  if (name.includes("exchange")) return { language: "powershell", lines: ["Get-ExchangeServer | Format-List Name,Edition,AdminDisplayVersion", "# Install the approved Exchange Security Update and reboot if required"] };
  return { language: "text", lines: ["# Replace placeholders with the approved product-specific command", "<apply-approved-security-update>", "<validate-service-health>", "<run-follow-up-scan>"] };
}

function extractHeadings(markdown) {
  return String(markdown || "").split(/\r?\n/).map((line) => {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    return match ? { level: match[1].length, text: cleanMarkdown(match[2]) } : null;
  }).filter(Boolean);
}

function cleanMarkdown(value) {
  return String(value).replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)");
}

function priorityRank(priority) {
  return { P1: 1, P2: 2, P3: 3, P4: 4 }[priority] ?? 9;
}

function safeName(value) {
  return String(value || "MVA").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}
