import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function copyRadarData() {
  return {
    name: "copy-radar-data",
    closeBundle() {
      const out = resolve("dist/data");
      mkdirSync(out, { recursive: true });
      cpSync(resolve("data/opportunities.json"), resolve(out, "opportunities.json"));
      cpSync(resolve("data/health.json"), resolve(out, "health.json"));
      cpSync(resolve("feed.xml"), resolve("dist/feed.xml"));
    }
  };
}

export default defineConfig({
  base: "/Siddhartha/",
  plugins: [react(), copyRadarData()]
});
