import { build } from "esbuild";

const agent = process.argv[2];
if (!agent) {
  console.error("positional argument missing: (retail | vendor)");
  process.exit();
}

if (agent.toLowerCase() === "retail") {
  await build({
    entryPoints: ["./retailAgent/index.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "./retailAgent/dist/index.js",
    sourcemap: false,
  });
} else if (agent.toLowerCase() === "vendor") {
  await build({
    entryPoints: ["./vendorAgent/index.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "./vendorAgent/dist/index.js",
    sourcemap: false,
  });
} else {
  console.error("Agent not found");
  process.exit();
}
