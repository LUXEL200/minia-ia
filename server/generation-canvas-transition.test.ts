import { describe, expect, it } from "vitest";
import { buildCanvasRoute, type GenerationCanvasRoutePayload } from "../client/src/lib/generationCanvasRoute";

describe("buildCanvasRoute", () => {
  it("transmet l'image, le brief et le style sans perdre les caractères spéciaux", () => {
    const payload: GenerationCanvasRoutePayload = {
      imageUrl: "/manus-storage/thumbnail-final.png",
      prompt: "Une miniature YouTube — énergie maximale & texte « TEST »",
      style: "viral",
    };

    const route = buildCanvasRoute(payload);
    const params = new URLSearchParams(route.split("?")[1]);

    expect(route.startsWith("/editor?")).toBe(true);
    expect(params.get("image")).toBe(payload.imageUrl);
    expect(params.get("prompt")).toBe(payload.prompt);
    expect(params.get("style")).toBe(payload.style);
    expect(params.get("from")).toBe("generation");
  });

  it("conserve un brief vide pour les lots dont la première ligne est absente", () => {
    const route = buildCanvasRoute({
      imageUrl: "https://cdn.example.test/variant.webp",
      prompt: "",
      style: "minimalist",
    });
    const params = new URLSearchParams(route.split("?")[1]);

    expect(params.get("prompt")).toBe("");
    expect(params.get("style")).toBe("minimalist");
  });
});

