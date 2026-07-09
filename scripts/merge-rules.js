const fs = require('fs');
const https = require('https');

const UPSTREAM_URL = 'https://raw.githubusercontent.com/CyberDrain/Check/main/rules/detection-rules.json';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'check-rules-merge' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const upstream = await fetchJson(UPSTREAM_URL);
  const customDomains = JSON.parse(fs.readFileSync('custom-domains.json', 'utf-8'));

  if (!upstream.exclusion_system) upstream.exclusion_system = {};
  if (!Array.isArray(upstream.exclusion_system.domain_patterns)) upstream.exclusion_system.domain_patterns = [];

  const merged = Array.from(new Set([...upstream.exclusion_system.domain_patterns, ...customDomains]));
  upstream.exclusion_system.domain_patterns = merged;

  fs.mkdirSync('rules', { recursive: true });
  fs.writeFileSync('rules/detection-rules.json', JSON.stringify(upstream, null, 2) + '\n');
  console.log(`Merged ${customDomains.length} custom domain(s) into upstream ruleset (${merged.length} total exclusion patterns).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
