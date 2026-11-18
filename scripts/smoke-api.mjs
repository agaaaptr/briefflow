// Smoke test untuk POST /api/briefs — jalankan saat server aktif:
//   npm run build && npx next start -p 3100 & node scripts/smoke-api.mjs
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3100";

// tunggu server siap (dipakai setelah `next start` di-background)
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

const valid = {
  name: "Aga",
  email: "aga@contoso.com",
  company: "PT Contoso",
  needs: "Rebranding dan website company profile",
  budget: "M25_50M",
  targetTimeline: "2026-12-01",
};

const cases = [
  ["valid -> 201", valid, 201],
  ["bad email -> 400", { ...valid, email: "bukan-email" }, 400],
  ["past date -> 400", { ...valid, targetTimeline: "2020-01-01" }, 400],
  ["empty name -> 400", { ...valid, name: "" }, 400],
  ["5th request still allowed -> 201", valid, 201],
  ["6th request rate limited -> 429", valid, 429],
];

let failed = 0;
await waitForServer(BASE);
for (const [label, body, expected] of cases) {
  const res = await fetch(`${BASE}/api/briefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  const ok = res.status === expected;
  if (!ok) failed++;
  const errs = data.fieldErrors ? ` ${JSON.stringify(data.fieldErrors)}` : "";
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: got ${res.status}${errs}`);
}
console.log(failed ? `\n${failed} FAILED` : "\nall PASS");
process.exit(failed ? 1 : 0);
