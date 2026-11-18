// Kirim satu brief ke server lokal (default mock-friendly) — dipakai verifikasi manual.
//   node scripts/post-brief.mjs '{"name":"Budi","email":"budi@x.com","company":"PT Maju","needs":"...","budget":"M25_50M","targetTimeline":"2026-12-15"}'
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3100";
const body = JSON.parse(process.argv[2] ?? "{}");

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
const res = await fetch(`${BASE}/api/briefs`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
console.log(res.status, await res.text());
