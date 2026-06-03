import { startDevServer, buildApp } from "wolfe/runtime";
import { unlinkSync, existsSync, readFileSync, writeFileSync } from "fs";

const args = Bun.argv.slice(2);
const port = 3000;
const CSS_OUT = "public/app.css";

function deleteCSS() {
  if (existsSync(CSS_OUT)) unlinkSync(CSS_OUT);
}

function tailwind(extraArgs: string[] = [], silent = false) {
  return Bun.spawn(
    ["bunx", "@tailwindcss/cli", "-i", "src/app.css", "-o", CSS_OUT, ...extraArgs],
    {
      stdout: silent ? "ignore" : "inherit",
      stderr: silent ? "ignore" : "inherit",
      env: { ...process.env, NODE_NO_WARNINGS: "1" }
    }
  );
}

if (args.includes("--build")) {
  deleteCSS();
  const css = tailwind(["--minify"]);
  await css.exited;

  await buildApp({
    entrypoints: ["src/app.ts"],
    outdir: "./public"
  });
  process.exit(0);
}

if (args.includes("--dev")) {
  deleteCSS();
  const css = tailwind();
  await css.exited;
  tailwind(["--watch"], true);

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
