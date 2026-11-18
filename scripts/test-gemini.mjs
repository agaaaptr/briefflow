// Diagnostik: panggil Gemini langsung (tanpa schema/timeout) untuk cek model + key.
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, ""),
    ]),
);
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

for (const model of [env.GEMINI_MODEL ?? "gemini-3.8-flash", "gemini-3.5-flash-lite"]) {
  const t0 = Date.now();
  try {
    const r = await ai.models.generateContent({
      model,
      contents: "Balas dengan satu kata: halo",
    });
    console.log(`${model} OK ${Date.now() - t0}ms -> ${r.text?.trim()}`);
  } catch (e) {
    console.log(`${model} ERR ${Date.now() - t0}ms -> ${e.message}`);
  }
}
