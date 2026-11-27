// The Hue panel gives the pages a stand-in for Home Control's plugin API (frontend/app/host.js): everything the pages register must be there, or the panel stops at that line.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const root = new URL("../../frontend/", import.meta.url);

test("the panel's stand-in has every registration the pages make", () => {
  const pages = readdirSync(new URL("src/", root))
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(new URL("src/" + f, root), "utf8"))
    .join("\n");
  const host = readFileSync(new URL("app/host.js", root), "utf8");
  const used = [...new Set([...pages.matchAll(/\bHC\.(register[A-Za-z]+)\(/g)].map((m) => m[1]))];
  assert.ok(used.length > 5);
  assert.deepEqual(used.filter((name) => !new RegExp(`\\b${name}: function`).test(host)), []);
});
