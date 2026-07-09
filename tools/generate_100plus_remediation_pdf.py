#!/usr/bin/env python3
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    KeepTogether,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from mva_engine.tenable_normalizer import load_findings


OUT_PATH = ROOT / "output" / "pdf" / "mva_100plus_remediation_guide.pdf"
CSV_PATH = ROOT / "samples" / "tenable_100_row" / "tenable_io_july_2026_100plus.csv"

PRIORITY_ORDER = {"P1": 0, "P2": 1, "P3": 2, "P4": 3}
SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4}


def main() -> None:
    findings = load_findings(CSV_PATH)
    findings = sorted(
        findings,
        key=lambda finding: (
            PRIORITY_ORDER.get(finding.patch_priority, 9),
            SEVERITY_ORDER.get(finding.severity, 9),
            -finding.asset_exposure,
            finding.dns_name,
        ),
    )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Remediation Guide",
    )

    styles = build_styles()
    story = []
    story.extend(cover(styles, findings))
    story.append(PageBreak())
    story.extend(summary_page(styles, findings))
    story.append(PageBreak())
    story.extend(remediation_actions(styles, findings[:12]))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT_PATH)


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            textColor=colors.HexColor("#0f172a"),
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#475569"),
            alignment=TA_CENTER,
            spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=21,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=6,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#075985"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748b"),
        ),
        "code": ParagraphStyle(
            "code",
            parent=base["Code"],
            fontName="Courier",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#e2e8f0"),
        ),
    }


def cover(styles: dict[str, ParagraphStyle], findings: list) -> list:
    total = len(findings)
    critical = sum(1 for finding in findings if finding.severity == "Critical")
    high = sum(1 for finding in findings if finding.severity == "High")
    immediate = sum(1 for finding in findings if finding.patch_priority in {"P1", "P2"})
    exploitable = sum(1 for finding in findings if finding.exploit_available)

    return [
        Spacer(1, 30 * mm),
        Paragraph("Remediation Guide", styles["title"]),
        Paragraph("Tool Source: Tenable.io | Report Month: July 2026", styles["subtitle"]),
        kpi_table(
            [
                ["Total Findings", str(total)],
                ["Critical", str(critical)],
                ["High", str(high)],
                ["Immediate Patch Needed", str(immediate)],
                ["Exploit Available", str(exploitable)],
            ]
        ),
        Spacer(1, 12 * mm),
        Paragraph("Contents", styles["h1"]),
        contents_table(),
    ]


def summary_page(styles: dict[str, ParagraphStyle], findings: list) -> list:
    priority_counts = Counter(finding.patch_priority for finding in findings)
    severity_counts = Counter(finding.severity for finding in findings)

    return [
        Paragraph("1. Report Summary", styles["h1"]),
        Paragraph(
            "This guide prioritizes remediation work using the approved MVA severity and exploit availability matrix. "
            "P1 and P2 items should be handled first because they represent the immediate remediation lane.",
            styles["body"],
        ),
        Paragraph("Priority Distribution", styles["h2"]),
        distribution_table(["P1", "P2", "P3", "P4"], priority_counts),
        Spacer(1, 8 * mm),
        Paragraph("Severity Distribution", styles["h2"]),
        distribution_table(["Critical", "High", "Medium", "Low"], severity_counts),
        Spacer(1, 8 * mm),
        Paragraph("Remediation Execution Notes", styles["h2"]),
        Paragraph(
            "Validate a maintenance window for service-impacting changes, keep rollback evidence, apply fixes by priority lane, "
            "and confirm closure with a follow-up scan after the change window.",
            styles["body"],
        ),
    ]


def remediation_actions(styles: dict[str, ParagraphStyle], findings: list) -> list:
    story = [Paragraph("2. Remediation Actions", styles["h1"])]
    for index, finding in enumerate(findings, start=1):
        block = [Paragraph(f"{index}. {escape(finding.vulnerability_name)}", styles["h2"])]
        block.append(
            detail_table(
                [
                    ["Asset", finding.dns_name or finding.ip_address],
                    ["IP / Port", f"{finding.ip_address}:{finding.port}/{finding.protocol}"],
                    ["Severity / Priority", f"{finding.severity} / {finding.patch_priority}"],
                    ["CVE", finding.cve or "N/A"],
                    ["KB Link", finding.kb_links or "N/A"],
                ]
            )
        )
        block.append(Paragraph(escape(finding.remediation), styles["body"]))
        block.append(command_box(styles["code"], command_for(finding)))
        block.append(Spacer(1, 5 * mm))
        story.append(KeepTogether(block))
    return story


def kpi_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[85 * mm, 55 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def contents_table() -> Table:
    return kpi_table(
        [
            ["1", "Report Summary"],
            ["2", "Remediation Actions"],
            ["3", "Validation Expectations"],
        ]
    )


def distribution_table(labels: list[str], counts: Counter) -> Table:
    rows = [["Lane", "Count"]] + [[label, str(counts.get(label, 0))] for label in labels]
    table = Table(rows, colWidths=[85 * mm, 45 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0f2fe")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#075985")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#bae6fd")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def detail_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[36 * mm, 124 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def command_box(style: ParagraphStyle, command: str) -> Table:
    para = Paragraph(escape(command).replace("\n", "<br/>"), style)
    table = Table([[para]], colWidths=[160 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#334155")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def command_for(finding) -> str:
    name = finding.vulnerability_name.lower()
    if "log4j" in name:
        return "find /opt -name 'log4j-core-*.jar' -print\n# upgrade application dependency to fixed Log4j release\nsystemctl restart <affected-service>"
    if "tomcat" in name:
        return "grep -R \"protocol=\\\"AJP\" /opt/tomcat/conf/server.xml\n# disable AJP or configure requiredSecret\nsystemctl restart tomcat"
    if "sql server" in name:
        return "SELECT @@VERSION;\n# upgrade to a supported SQL Server release or migrate workload\n# run validation scan after maintenance window"
    if "openssl" in name:
        return "openssl version -a\n# apply vendor OpenSSL package update\nsystemctl restart <affected-service>"
    if "remote desktop" in name:
        return "gpupdate /force\n# enforce strong RDP encryption via Group Policy\n# reconnect and validate negotiated security layer"
    return "# apply vendor security update\n# restart affected service if required\n# rerun vulnerability scan and confirm closure"


def footer(canvas, doc) -> None:
    canvas.saveState()
    width, _ = A4
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(18 * mm, 10 * mm, "Remediation Guide")
    canvas.drawRightString(width - 18 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def escape(value: object) -> str:
    text = "" if value is None else str(value)
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


if __name__ == "__main__":
    main()
