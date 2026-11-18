// Smoke test auth guard — jalankan saat server aktif (sama seperti smoke-api).
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3100";

let failed = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` ${detail}` : ""}`);
};

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

const r1 = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
check(
  "GET /dashboard tanpa sesi -> redirect ke /login",
  r1.status >= 300 &&
    r1.status < 400 &&
    (r1.headers.get("location") ?? "").includes("/login"),
  `status=${r1.status} location=${r1.headers.get("location")}`,
);

const r2 = await fetch(`${BASE}/login`, { redirect: "manual" });
check("GET /login -> 200", r2.status === 200, `status=${r2.status}`);

const r3 = await fetch(`${BASE}/`, { redirect: "manual" });
check("form publik tetap terbuka (GET / -> 200)", r3.status === 200);

console.log(failed ? `\n${failed} FAILED` : "\nall PASS");
process.exit(failed ? 1 : 0);
