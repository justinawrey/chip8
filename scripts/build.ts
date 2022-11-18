import { build, stop } from "https://deno.land/x/esbuild@v0.15.14/mod.js";

await build({
  entryPoints: ["./src/main.ts"],
  outfile: "./static/dist/chip8.bundle.min.js",
  format: "esm",
  bundle: true,
  minify: true,
});

stop();
