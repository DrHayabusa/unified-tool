from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Iterable

from .tenable_normalizer import (
    AGE_BUCKETS,
    NormalizedFinding,
    age_bucket_flags,
    age_in_days,
    load_findings,
    parse_date,
)


PRIORITIES = ["P1", "P2", "P3", "P4"]
SEVERITIES = ["Critical", "High", "Medium", "Low", "Info", "Unknown"]


@dataclass(frozen=True)
class MonthlySnapshot:
    month: str
    findings: list[NormalizedFinding]
    report_date: date


def build_adhoc_dashboard(findings: Iterable[NormalizedFinding]) -> dict[str, object]:
    rows = list(findings)
    severity_counts = _ordered_counter((finding.severity for finding in rows), SEVERITIES)
    priority_counts = _ordered_counter((finding.patch_priority for finding in rows), PRIORITIES)
    asset_counts = Counter(_asset_label(finding) for finding in rows)

    return {
        "total_vulnerabilities": len(rows),
        "severity_counts": severity_counts,
        "patch_priority_counts": priority_counts,
        "top_10_affected_assets": [
            {"asset": asset, "vulnerability_count": count}
            for asset, count in asset_counts.most_common(10)
        ],
    }


def build_monthly_comparison(snapshots: list[MonthlySnapshot]) -> dict[str, object]:
    if len(snapshots) < 2:
        raise ValueError("Monthly comparison requires at least two monthly snapshots")

    ordered = sorted(snapshots, key=lambda snapshot: snapshot.report_date)
    previous = ordered[-2]
    current = ordered[-1]

    previous_by_key = _dedupe_by_key(previous.findings)
    current_by_key = _dedupe_by_key(current.findings)

    previous_keys = set(previous_by_key)
    current_keys = set(current_by_key)
    new_keys = current_keys - previous_keys
    carried_forward_keys = current_keys & previous_keys
    patched_keys = previous_keys - current_keys

    current_findings = list(current_by_key.values())
    patched_formula_value = len(previous_keys) + len(new_keys) - len(current_keys)

    return {
        "trend_discovered_last_3_months": _build_discovery_trend(ordered[-3:]),
        "trend_remediated_last_3_months": _build_remediated_trend(ordered[-4:]),
        "total_open_vulnerabilities": {
            "total_open": len(current_keys),
            "new_vulnerabilities": len(new_keys),
            "not_closed_from_previous_months": len(carried_forward_keys),
        },
        "total_open_by_patch_priority": _ordered_counter(
            (finding.patch_priority for finding in current_findings),
            PRIORITIES,
        ),
        "total_open_by_age_and_patch_priority": _build_age_priority_matrix(
            current_findings,
            current.report_date,
        ),
        "total_vulnerabilities_patched_last_month": {
            "previous_month": previous.month,
            "current_month": current.month,
            "previous_month_open": len(previous_keys),
            "new_vulnerabilities_identified_this_month": len(new_keys),
            "current_month_open": len(current_keys),
            "patched_count": max(0, patched_formula_value),
            "patched_count_by_key_diff": len(patched_keys),
            "formula": "previous_month_open + new_vulnerabilities_identified_this_month - current_month_open",
        },
    }


def load_monthly_snapshot(csv_path: str | Path, month: str | None = None) -> MonthlySnapshot:
    findings = load_findings(csv_path)
    report_date = infer_report_date(findings)
    return MonthlySnapshot(
        month=month or report_date.strftime("%B %Y"),
        findings=findings,
        report_date=report_date,
    )


def infer_report_date(findings: Iterable[NormalizedFinding]) -> date:
    observed_dates = [
        parsed.date()
        for finding in findings
        if (parsed := parse_date(finding.last_observed))
    ]
    if observed_dates:
        return max(observed_dates)
    return date.today()


def _build_discovery_trend(snapshots: list[MonthlySnapshot]) -> list[dict[str, object]]:
    trend = []
    for snapshot in snapshots:
        month_start = snapshot.report_date.replace(day=1)
        discovered_count = 0
        for finding in _dedupe_by_key(snapshot.findings).values():
            discovered = parse_date(finding.first_discovered)
            if discovered and discovered.date().replace(day=1) == month_start:
                discovered_count += 1
        trend.append({"month": snapshot.month, "discovered_count": discovered_count})
    return trend


def _build_remediated_trend(snapshots: list[MonthlySnapshot]) -> list[dict[str, object]]:
    trend = []
    for previous, current in zip(snapshots, snapshots[1:]):
        previous_keys = set(_dedupe_by_key(previous.findings))
        current_keys = set(_dedupe_by_key(current.findings))
        trend.append({
            "month": current.month,
            "remediated_count": len(previous_keys - current_keys),
        })
    return trend[-3:]


def _build_age_priority_matrix(findings: list[NormalizedFinding], as_of: date) -> dict[str, dict[str, int]]:
    matrix: dict[str, dict[str, int]] = {
        priority: {bucket: 0 for bucket in AGE_BUCKETS}
        for priority in PRIORITIES
    }

    for finding in findings:
        priority = finding.patch_priority if finding.patch_priority in PRIORITIES else "P4"
        flags = age_bucket_flags(age_in_days(finding, as_of=as_of))
        for bucket, is_in_bucket in flags.items():
            if is_in_bucket:
                matrix[priority][bucket] += 1

    return matrix


def _ordered_counter(values: Iterable[str], order: list[str]) -> dict[str, int]:
    counts = Counter(values)
    return {key: counts.get(key, 0) for key in order}


def _dedupe_by_key(findings: Iterable[NormalizedFinding]) -> dict[str, NormalizedFinding]:
    deduped = {}
    for finding in findings:
        deduped[finding.finding_key] = finding
    return deduped


def _asset_label(finding: NormalizedFinding) -> str:
    return finding.dns_name or finding.ip_address or "Unknown Asset"
