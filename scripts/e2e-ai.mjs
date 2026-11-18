// Bukti end-to-end: POST brief → tunggu AI selesai (after()) → baca hasil dari DB.
import { readFileSync } from "node:fs";
import { Client } from "pg";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3100";
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, ""),
    ]),
);

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`server tidak siap dalam ${timeoutMs}ms di ${url}`);
}

await waitForServer(BASE);

const body = {
  name: "Demo E2E",
  email: "demo@contoso.com",
  company: "PT Demo E2E",
  needs: "Kami butuh rebranding identitas visual dan pembuatan website company profile sebelum peluncuran produk baru",
  budget: "M50_100M",
  targetTimeline: "2026-12-20",
};

const t0 = Date.now();
const res = await fetch(`${BASE}/api/briefs`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const { id } = await res.json();
console.log(`POST ${res.status} id=${id} dalam ${Date.now() - t0}ms`);

const client = new Client({ connectionString: env.DATABASE_URL });
await client.connect();
let row;
for (let i = 0; i < 45; i++) {
  const r = await client.query(
    `SELECT "aiStatus", "aiCategory", "aiPriority", "aiResult"->>'provider' AS provider,
            "aiResult"->>'model' AS model, left("aiResult"->>'summary', 70) AS summary
     FROM "Brief" WHERE id = $1`,
    [id],
  );
  row = r.rows[0];
  if (row && row.aiStatus !== "PENDING" && row.aiStatus !== "PROCESSING") break;
  await new Promise((r) => setTimeout(r, 2000));
}
await client.end();

console.log("HASIL AI:", JSON.stringify(row, null, 2));
const ok = row && row.aiStatus === "SUCCESS";
console.log(ok ? "\nPASS: AI sukses (provider " + row.provider + ")" : "\nFAIL: aiStatus=" + row?.aiStatus);
process.exit(ok ? 0 : 1);
