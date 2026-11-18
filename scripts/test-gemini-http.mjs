// Diagnostik: raw REST ke Gemini (tanpa SDK) dengan timeout 12s — isolasi SDK vs network.
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
const key = env.GEMINI_API_KEY;
for (const model of [env.GEMINI_MODEL ?? "gemini-3.8-flash", "gemini-3.5-flash-lite"]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "halo" }] }] }),
      signal: AbortSignal.timeout(12_000),
    });
    const text = await res.text();
    console.log(`${model} HTTP ${res.status} ${Date.now() - t0}ms -> ${text.slice(0, 120)}`);
  } catch (e) {
    console.log(`${model} ERR ${Date.now() - t0}ms -> ${e.name}: ${e.message}`);
  }
}
