import { access, readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("module.json", "utf8"));
const requiredFiles = [
  ...manifest.esmodules,
  ...manifest.styles,
  ...manifest.languages.map(({ path }) => path),
  manifest.license,
  manifest.readme
];

for (const file of requiredFiles) await access(file);

if (manifest.id !== "enhancedcombathud-essence20") {
  throw new Error("Unexpected module id");
}

if (!manifest.relationships.requires.some(({ id }) => id === "enhancedcombathud")) {
  throw new Error("Argon Core must be a required module");
}

if (!manifest.relationships.systems.some(({ id }) => id === "essence20")) {
  throw new Error("Essence20 must be the declared system");
}

console.log(`Validated ${manifest.id} ${manifest.version}`);
