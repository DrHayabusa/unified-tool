const monthlySamples = {
  "tenable-sc": ["april", "may", "june", "july"].map((month) => `sample-data/tenable-sc/tenable_sc_${month}_2026_100plus.csv`),
  "tenable-io": ["april", "may", "june", "july"].map((month) => `sample-data/tenable-io/tenable_io_${month}_2026_100plus.csv`),
  qualys: ["april", "may", "june", "july"].map((month) => `sample-data/qualys/qualys_monthly_${month}_2026_100plus.csv`),
  crowdstrike: ["april", "may", "june", "july"].map((month) => `sample-data/crowdstrike/crowdstrike_vulnerabilities_${month}_2026_100plus.csv`),
};

const adhocSamples = {
  "tenable-sc": "sample-data/tenable-sc/tenable_sc_july_2026_100plus.csv",
  "tenable-io": "sample-data/tenable-io/tenable_io_july_2026_100plus.csv",
  qualys: "sample-data/qualys/qualys_adhoc_july_2026_100plus.csv",
  crowdstrike: "sample-data/crowdstrike/crowdstrike_vulnerability_per_asset_july_2026_100plus.csv",
};

export async function loadBundledSamples(sourceId, workflow, crowdStrikeVariant = "vulnerability-per-asset") {
  let paths = workflow === "monthly" ? monthlySamples[sourceId] : [adhocSamples[sourceId]];
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
    return new File([blob], path.split("/").at(-1), { type: "text/csv" });
  }));
}
