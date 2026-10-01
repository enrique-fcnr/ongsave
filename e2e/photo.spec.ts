import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import sharp from "sharp";
test("preparação real da foto reduz resolução e rejeita arquivo inválido", async ({ page }) => {
  await page.goto("/");
  const compiled = ts.transpileModule(readFileSync("src/lib/prepare-photo.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  await page.addScriptTag({
    content: `window.__photoModule={};(function(exports){${compiled}})(window.__photoModule);`,
  });
  const jpeg = await sharp({
    create: { width: 4000, height: 3000, channels: 3, background: "#729d64" },
  })
    .jpeg()
    .toBuffer();
  const result = await page.evaluate(async (base64) => {
    const photoModule = (
      window as unknown as { __photoModule: { preparePhoto(file: File): Promise<File> } }
    ).__photoModule;
    const blob = await fetch(`data:image/jpeg;base64,${base64}`).then((r) => r.blob());
    const photo = await photoModule.preparePhoto(
      new File([blob], "camera.jpg", { type: "image/jpeg" }),
    );
    const image = await createImageBitmap(photo);
    const dimensions = [image.width, image.height];
    image.close();
    let rejected = false;
    try {
      await photoModule.preparePhoto(new File(["invalid"], "fake.jpg", { type: "image/jpeg" }));
    } catch {
      rejected = true;
    }
    return { type: photo.type, size: photo.size, dimensions, rejected };
  }, jpeg.toString("base64"));
  expect(result.type).toBe("image/jpeg");
  expect(result.dimensions).toEqual([1600, 1200]);
  expect(result.size).toBeLessThan(4 * 1024 * 1024);
  expect(result.rejected).toBe(true);
});
