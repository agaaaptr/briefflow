// Verifikasi dashboard ter-auth: seal session langsung dengan SESSION_SECRET,
// lalu fetch halaman + filter dan cari konten yang diharapkan.
import { sealData } from "iron-session";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, ""),
    ]),
);
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3100";

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

const sealed = await sealData(
  { email: env.ADMIN_EMAIL },
  { password: env.SESSION_SECRET },
);
const cookie = `briefflow_session=${sealed}`;

let failed = 0;
async function check(path, needle, label, notContains) {
  const r = await fetch(BASE + path, {
    headers: { cookie },
    redirect: "manual",
  });
  const html = await r.text();
  let ok = r.status === 200 && html.includes(needle);
  if (notContains && html.includes(notContains)) ok = false;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${label} (status=${r.status})`,
  );
}

async function checkRedirect(path, label) {
  const r = await fetch(BASE + path, { headers: { cookie }, redirect: "manual" });
  const ok = r.status >= 300 && r.status < 400;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label} (status=${r.status})`);
}
void checkRedirect;

await waitForServer(BASE);

await check("/dashboard", "PT Maju Jaya", "list tanpa filter memuat brief");
await check("/dashboard?priority=LOW", "CV Tono Media", "filter priority=LOW");
await check("/dashboard?category=BRANDING", "Kopi Wati", "filter category=BRANDING");
await check(
  "/dashboard?priority=HIGH&category=BRANDING",
  "Kopi Wati",
  "filter kombinasi HIGH+BRANDING",
);
await check(
  "/dashboard?priority=LOW&category=BRANDING",
  "Tidak ada brief yang cocok",
  "kombinasi tanpa hasil -> empty state",
);
// cookie sesi yang dipalsukan harus ditolak (seal tidak valid -> layout redirect)
const r2 = await fetch(`${BASE}/dashboard`, {
  headers: { cookie: "briefflow_session=garbage" },
  redirect: "manual",
});
const ok2 = r2.status >= 300 && r2.status < 400;
if (!ok2) failed++;
console.log(`${ok2 ? "PASS" : "FAIL"} cookie sesi invalid -> redirect (status=${r2.status})`);

// halaman detail brief pertama memuat data form + hasil AI + tombol proses ulang
const listHtml = await (
  await fetch(`${BASE}/dashboard`, { headers: { cookie }, redirect: "manual" })
).text();
const firstDetail = listHtml.match(/\/dashboard\/briefs\/[a-z0-9]+/i)?.[0];
if (firstDetail) {
  const dr = await fetch(BASE + firstDetail, {
    headers: { cookie },
    redirect: "manual",
  });
  const dhtml = await dr.text();
  const ok3 =
    dr.status === 200 &&
    dhtml.includes("Hasil AI") &&
    dhtml.includes("Proses ulang AI") &&
    dhtml.includes("Pipeline");
  if (!ok3) failed++;
  console.log(`${ok3 ? "PASS" : "FAIL"} detail brief memuat hasil AI + aksi (status=${dr.status})`);
} else {
  failed++;
  console.log("FAIL tidak menemukan link detail brief");
}

console.log(failed ? `\n${failed} FAILED` : "\nall PASS");
process.exit(failed ? 1 : 0);
