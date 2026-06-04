import { startDevServer, buildApp } from "wolfe/runtime";
import { unlinkSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

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

if (args.includes("--plugin")) {
  deleteCSS();
  const css = tailwind(["--minify"]);
  await css.exited;

  mkdirSync("dist", { recursive: true });
  const cssContent = readFileSync(CSS_OUT, "utf-8");

  const result = await Bun.build({
    entrypoints: ["src/plugin.ts"],
    outdir: "./dist",
    naming: "[dir]/wolfe-html-editor.min.[ext]",
    minify: true,
    target: "browser",
    format: "iife",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  // Inject CSS into the JS bundle (JSON-escaped)
  const jsPath = "dist/wolfe-html-editor.min.js";
  let js = readFileSync(jsPath, "utf-8");
  js = js.replace('"__CSS_INLINE__"', JSON.stringify(cssContent));
  writeFileSync(jsPath, js);

  console.log("[plugin] built → dist/wolfe-html-editor.min.js (CSS inlined)");
  process.exit(0);
}

console.log("Usage:");
console.log("  bun run index.ts --dev");
console.log("  bun run index.ts --build");
console.log("  bun run index.ts --plugin");
process.exit(1);
