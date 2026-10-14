import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { prepareProfilePhoto, profilePhotoPath } from "../src/lib/profile-photo";

describe("Foto de perfil", () => {
  it("limita o caminho ao próprio usuário e a referências internas válidas", () => {
    const version = "26f71d9d-74a6-49ca-b0f9-857c47a242de";
    expect(profilePhotoPath("own-user", `/api/profile/photo?v=${version}`)).toBe(
      `own-user/${version}.webp`,
    );
    for (const url of [
      null,
      "https://example.com/photo.jpg",
      "/api/profile/photo?v=../../another-user",
      "/api/profile/photo?v=bad",
    ])
      expect(profilePhotoPath("own-user", url)).toBeNull();
  });
  it("converte fotos em avatar quadrado sem conservar metadados pessoais", async () => {
    const source = await sharp({
      create: { width: 900, height: 600, channels: 3, background: "#22694f" },
    })
      .jpeg()
      .withMetadata()
      .toBuffer();
    const output = await prepareProfilePhoto(
      new File([new Uint8Array(source)], "photo.jpg", { type: "image/jpeg" }),
    );
    const metadata = await sharp(output).metadata();
    expect(metadata).toMatchObject({ format: "webp", width: 512, height: 512 });
    expect(metadata.exif).toBeUndefined();
  });
  it("rejeita arquivos vazios, grandes ou falsamente identificados como imagem", async () => {
    for (const file of [
      new File([], "empty.jpg"),
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.jpg"),
      new File(
        ["<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'></svg>"],
        "fake.jpg",
        { type: "image/jpeg" },
      ),
    ])
      await expect(prepareProfilePhoto(file)).rejects.toThrow();
  });
});
