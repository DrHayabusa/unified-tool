const mapping = {
  "Tenable.sc": {
    format: "SC CSV",
    ip: "IP Address",
    dns: "DNS Name / NetBIOS Name",
    name: "Plugin Name",
    cve: "CVE",
    exploit: "Exploit?",
    remediation: "Steps to Remediate",
  },
  "Tenable.io": {
    format: "IO CSV",
    ip: "asset.display_ipv4_address",
    dns: "asset.display_fqdn / asset.host_name",
    name: "definition.name",
    cve: "definition.cve",
    exploit: "Exploit Ease / exploitability fields",
    remediation: "definition.solution",
  },
  MDVM: {
    format: "CSV or XLSX",
    ip: "Device IP / Asset ID",
    dns: "Device Name",
    name: "Recommendation / Vulnerability",
    cve: "CVE",
    exploit: "Exploit available / Exposure signal",
    remediation: "Recommended Action",
  },
  CrowdStrike: {
    format: "CSV or XLSX",
    ip: "Local IP / External IP",
    dns: "Hostname",
    name: "Vulnerability Title",
    cve: "CVE ID",
    exploit: "Exploit Status",
    remediation: "Remediation Recommendation",
  },
  Qualys: {
    format: "CSV or XLSX",
    ip: "IP",
    dns: "DNS / NetBIOS",
    name: "Title",
    cve: "CVE ID",
    exploit: "Exploitability / Threat Intel",
    remediation: "Solution",
  },
  "Custom CSV": {
    format: "Mapped CSV",
    ip: "Mapped IP field",
    dns: "Mapped DNS field",
    name: "Mapped vulnerability field",
    cve: "Mapped CVE field",
    exploit: "Mapped exploit field",
    remediation: "Mapped remediation field",
  },
};

const cards = document.querySelectorAll(".source-card");
const selectedSourcePill = document.querySelector("#selectedSourcePill");
const formatPill = document.querySelector("#formatPill");
const requestSource = document.querySelector("#requestSource");
const payloadSource = document.querySelector("#payloadSource");
const mappingSource = document.querySelector("#mappingSource");
const mapIp = document.querySelector("#mapIp");
const mapDns = document.querySelector("#mapDns");
const mapName = document.querySelector("#mapName");
const mapCve = document.querySelector("#mapCve");
const mapExploit = document.querySelector("#mapExploit");
const mapRemediation = document.querySelector("#mapRemediation");

function setSource(source) {
  const config = mapping[source];
  if (!config) return;

  cards.forEach((card) => card.classList.toggle("active", card.dataset.source === source));
  selectedSourcePill.textContent = `${source} selected`;
  formatPill.textContent = config.format;
  requestSource.textContent = source;
  payloadSource.textContent = source;
  mappingSource.textContent = source;
  mapIp.textContent = config.ip;
  mapDns.textContent = config.dns;
  mapName.textContent = config.name;
  mapCve.textContent = config.cve;
  mapExploit.textContent = config.exploit;
  mapRemediation.textContent = config.remediation;
}

cards.forEach((card) => {
  card.addEventListener("click", () => setSource(card.dataset.source));
});
