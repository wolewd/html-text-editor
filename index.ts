import { startDevServer, buildApp } from "wolfe/runtime";

const args = Bun.argv.slice(2);
const port = 3000;

if (args.includes("--build")) {
  await buildApp({
    entrypoints: ["src/app.ts"],
    outdir: "./public"
  });
  process.exit(0);
}

if (args.includes("--dev")) {
  await startDevServer({
    port: port,
    entrypoints: ["src/app.ts"],
    watchDirs: ["src", "public"],
  });
  await new Promise(() => {});
}

console.log("Usage:");
console.log("  bun run index.ts --dev");
console.log("  bun run index.ts --build");
process.exit(1);
