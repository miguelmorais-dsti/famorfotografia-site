#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/assets/photos"
COUNT="${1:-120}"
MAX_PER_POST="${2:-12}"
MAX_PAGES="${3:-18}"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/famor-scrape.XXXXXX")"
URLS_FILE="$TMP_DIR/urls.raw"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$OUT_DIR"
: > "$URLS_FILE"

cursor=""
has_next="1"
page="1"

while [ "$page" -le "$MAX_PAGES" ] && [ "$has_next" = "1" ]; do
  page_file="$TMP_DIR/page-$page.json"
  parsed_file="$TMP_DIR/page-$page.parsed"

  if [ -z "$cursor" ]; then
    request_url="https://i.instagram.com/api/v1/users/web_profile_info/?username=famorfotografia"
  else
    request_url="https://i.instagram.com/api/v1/users/web_profile_info/?username=famorfotografia&max_id=$cursor"
  fi

  curl -sS -L --max-time 30 \
    -H 'x-ig-app-id: 936619743392459' \
    -H 'User-Agent: Mozilla/5.0' \
    "$request_url" \
    -o "$page_file"

  node - <<'NODE' "$page_file" "$MAX_PER_POST" > "$parsed_file"
const fs = require("fs");
const [jsonPath, maxPerPostRaw] = process.argv.slice(2);
const maxPerPost = Math.max(1, Number(maxPerPostRaw || 2));

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const timeline = data?.data?.user?.edge_owner_to_timeline_media;

if (!timeline) {
  console.log("META 0");
  process.exit(0);
}

const edges = timeline.edges || [];
for (const edge of edges) {
  const node = edge?.node || {};
  const shortcode = node.shortcode || "na";
  const candidates = [];
  if (node.display_url) candidates.push(node.display_url);

  const children = node?.edge_sidecar_to_children?.edges || [];
  for (const child of children) {
    if (child?.node?.display_url) {
      candidates.push(child.node.display_url);
    }
  }

  const uniqueCandidates = [...new Set(candidates)].slice(0, maxPerPost);
  for (const url of uniqueCandidates) {
    console.log(`URL ${shortcode} ${url}`);
  }
}

const hasNext = timeline?.page_info?.has_next_page ? "1" : "0";
const cursor = timeline?.page_info?.end_cursor || "";
if (cursor) {
  console.log(`META ${hasNext} ${cursor}`);
} else {
  console.log(`META ${hasNext}`);
}
NODE

  while IFS= read -r line; do
    kind="${line%% *}"

    if [ "$kind" = "URL" ]; then
      echo "$line" >> "$URLS_FILE"
      continue
    fi

    if [ "$kind" = "META" ]; then
      has_next="$(echo "$line" | awk '{print $2}')"
      cursor="$(echo "$line" | cut -d' ' -f3-)"
    fi
  done < "$parsed_file"

  page=$((page + 1))
done

node - <<'NODE' "$URLS_FILE" "$OUT_DIR" "$COUNT"
const fs = require("fs");
const path = require("path");
const [rawUrlsPath, outDir, maxCountRaw] = process.argv.slice(2);
const maxCount = Number(maxCountRaw || 96);
const rawLines = fs.readFileSync(rawUrlsPath, "utf8").split("\n").filter(Boolean);

const byPost = new Map();
const globalPathSeen = new Set();
for (const line of rawLines) {
  const match = line.match(/^URL\s+(\S+)\s+(https:\/\/.+)$/);
  if (!match) continue;
  const shortcode = match[1];
  const url = match[2];
  let canonicalKey;
  try {
    const parsed = new URL(url);
    canonicalKey = `${parsed.origin}${parsed.pathname}`;
  } catch {
    canonicalKey = url;
  }
  if (globalPathSeen.has(canonicalKey)) continue;
  globalPathSeen.add(canonicalKey);
  if (!byPost.has(shortcode)) byPost.set(shortcode, []);
  byPost.get(shortcode).push({ canonicalKey, url });
}

const postKeys = [...byPost.keys()];
const selected = [];
const seen = new Set();

// Round-robin across posts to avoid over-representation of one wedding/session.
while (selected.length < maxCount) {
  let addedThisRound = 0;
  for (const key of postKeys) {
    const queue = byPost.get(key) || [];
    if (!queue.length) continue;
    const item = queue.shift();
    if (!seen.has(item.canonicalKey)) {
      seen.add(item.canonicalKey);
      selected.push({ shortcode: key, url: item.url });
      addedThisRound += 1;
      if (selected.length >= maxCount) break;
    }
  }
  if (addedThisRound === 0) break;
}

if (!selected.length) {
  process.exit(1);
}

const manifest = selected.map((item, i) => ({
  file: `photo-${String(i + 1).padStart(3, "0")}.jpg`,
  shortcode: item.shortcode,
  url: item.url
}));

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
NODE

find "$OUT_DIR" -maxdepth 1 -type f -name 'photo-*.jpg' -delete

while IFS= read -r row; do
  file_name="$(echo "$row" | cut -d' ' -f1)"
  url="$(echo "$row" | cut -d' ' -f2-)"
  curl -f -sS -L --retry 2 --max-time 45 "$url" -o "$OUT_DIR/$file_name" || true
done < <(
  node -e '
    const fs = require("fs");
    const path = require("path");
    const outDir = process.argv[1];
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
    for (const item of manifest) console.log(`${item.file} ${item.url}`);
  ' "$OUT_DIR"
)

node -e '
  const fs = require("fs");
  const path = require("path");
  const outDir = process.argv[1];
  const manifestPath = path.join(outDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const gallery = manifest
    .filter((m) => {
      const filePath = path.join(outDir, m.file);
      if (!fs.existsSync(filePath)) return false;
      return fs.statSync(filePath).size > 1024;
    })
    .map((m) => `./assets/photos/${m.file}`);
  const outFile = path.join(path.dirname(outDir), "..", "gallery-data.js");
  fs.writeFileSync(outFile, `window.FAMOR_GALLERY = ${JSON.stringify(gallery, null, 2)};\n`);
  console.log(`Generated ${gallery.length} local gallery paths in ${outFile}`);
' "$OUT_DIR"
