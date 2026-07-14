const monthlySamples = {
  "tenable-sc": ["april", "may", "june", "july"].map((month) => `sample-data/tenable-sc/tenable_sc_${month}_2026_100plus.csv`),
  "tenable-io": ["april", "may", "june", "july"].map((month) => `sample-data/tenable-io/tenable_io_${month}_2026_100plus.csv`),
  qualys: ["april", "may", "june", "july"].map((month) => `sample-data/qualys/qualys_monthly_${month}_2026_100plus.csv`),
};

const crowdStrikeMonthlySamples = {
  vulnerabilities: ["april", "may", "june", "july"].map((month) => `sample-data/crowdstrike/crowdstrike_vulnerabilities_${month}_2026_100plus.csv`),
  // Both detailed exports share the supported per-finding schema in this test pack.
  "vulnerability-per-asset": ["april", "may", "june", "july"].map((month) => `sample-data/crowdstrike/crowdstrike_vulnerabilities_${month}_2026_100plus.csv`),
};

const adhocSamples = {
  "tenable-sc": "sample-data/tenable-sc/tenable_sc_july_2026_100plus.csv",
  "tenable-io": "sample-data/tenable-io/tenable_io_july_2026_100plus.csv",
  qualys: "sample-data/qualys/qualys_adhoc_july_2026_100plus.csv",
  crowdstrike: "sample-data/crowdstrike/crowdstrike_vulnerability_per_asset_july_2026_100plus.csv",
};

export async function loadBundledSamples(sourceId, workflow, crowdStrikeVariant = "vulnerability-per-asset") {
  const comparisonWorkflow = workflow === "monthly" || workflow === "quarterly";
  let paths = comparisonWorkflow ? monthlySamples[sourceId] : [adhocSamples[sourceId]];
  if (comparisonWorkflow && sourceId === "crowdstrike") {
    paths = crowdStrikeMonthlySamples[crowdStrikeVariant] ?? crowdStrikeMonthlySamples["vulnerability-per-asset"];
  }
  if (workflow === "adhoc" && sourceId === "crowdstrike") {
    const variants = {
      vulnerabilities: "sample-data/crowdstrike/crowdstrike_vulnerabilities_july_2026_100plus.csv",
      "vulnerability-per-asset": "sample-data/crowdstrike/crowdstrike_vulnerability_per_asset_july_2026_100plus.csv",
      "remediation-per-assets": "sample-data/crowdstrike/crowdstrike_remediation_per_assets_july_2026_100plus.csv",
    };
    paths = [variants[crowdStrikeVariant] ?? variants["vulnerability-per-asset"]];
  }
  if (!paths?.every(Boolean)) throw new Error(`No bundled sample is available for ${sourceId}.`);

  return Promise.all(paths.map(async (path) => {
    const url = `${import.meta.env.BASE_URL}${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sample download failed with HTTP ${response.status}: ${path}`);
    const blob = await response.blob();
    const sourceName = path.split("/").at(-1);
    let fileName = comparisonWorkflow && sourceId === "crowdstrike" && crowdStrikeVariant === "vulnerability-per-asset"
      ? sourceName.replace("crowdstrike_vulnerabilities_", "crowdstrike_vulnerability_per_asset_")
      : sourceName;
    if (workflow !== "quarterly") return new File([blob], fileName, { type: "text/csv" });

    const index = paths.indexOf(path);
    const quarter = index + 1;
    const text = shiftSampleDatesToQuarter(await blob.text());
    fileName = fileName.replace(/(?:april|may|june|july)_2026/i, `q${quarter}_2026`);
    return new File([text], fileName, { type: "text/csv" });
  }));
}

function shiftSampleDatesToQuarter(text) {
  const targetMonths = { "04": 3, "05": 6, "06": 9, "07": 12 };
  return text.replace(/2026-(04|05|06|07)-(\d{2})/g, (_match, sourceMonth, dayText) => {
    const month = targetMonths[sourceMonth];
    const maxDay = new Date(Date.UTC(2026, month, 0)).getUTCDate();
    const day = Math.min(Number(dayText), maxDay);
    return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}
