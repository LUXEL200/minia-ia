import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Canvas P1 interaction contract", () => {
  const editor = readFileSync(resolve(process.cwd(), "client/src/pages/Editor.tsx"), "utf8");

  it("keeps the contextual editing workflow", () => {
    expect(editor).toContain("const renderContextToolbar");
    expect(editor).toContain("onDoubleClick={e =>");
    expect(editor).toContain("setEditingTextId(el.id)");
    expect(editor).toContain("fontFamily");
  });

  it("keeps the layer-management workflow", () => {
    expect(editor).toContain("const renderLayersPanel");
    expect(editor).toContain("toggleElementFlag(el.id, \"visible\")");
    expect(editor).toContain("toggleElementFlag(el.id, \"locked\")");
    expect(editor).toContain("duplicateSelected");
    expect(editor).toContain("handleRotateMouseDown");
    expect(editor).toContain("alignmentGuides");
    expect(editor).toContain("snapElementPosition");
  });

  it("keeps image adjustments and both export formats", () => {
    expect(editor).toContain("saturation");
    expect(editor).toContain("contrast");
    expect(editor).toContain("const exportJpeg");
    expect(editor).toContain("toJpeg");
    expect(editor).toContain("exportCanvas");
    expect(editor).toContain("YouTube");
    expect(editor).toContain("Bebas Neue");
  });

  it("imports generated images as editable layers and exposes typography effects", () => {
    expect(editor).toContain("insertImageUrlAsLayer");
    expect(editor).toContain('source: "generated"');
    expect(editor).toContain("Génération / calque");
    expect(editor).toContain("textEffect");
    expect(editor).toContain('value="texture"');
    expect(editor).toContain('value="blend"');
    expect(editor).toContain("paragraphStyle");
    expect(editor).toContain('value="bullet"');
    expect(editor).toContain('value="numbered"');
  });

  it("exposes custom texture import, layer groups and before/after comparison", () => {
    expect(editor).toContain("textureInputRef");
    expect(editor).toContain("Texture personnalisée");
    expect(editor).toContain("TEXTURE_LIBRARY");
    expect(editor).toContain("Sélectionne au moins deux calques");
    expect(editor).toContain("event.metaKey || event.ctrlKey");
    expect(editor).toContain("groupSelectedWithNearest");
    expect(editor).toContain("ungroupSelected");
    expect(editor).toContain("Aperçu avant / après");
  });

  it("keeps avatar upload and the simplified navigation contract", () => {
    const avatars = readFileSync(resolve(process.cwd(), "client/src/pages/Avatars.tsx"), "utf8");
    const routers = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const sidebar = readFileSync(resolve(process.cwd(), "client/src/components/AppSidebar.tsx"), "utf8");
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const shell = readFileSync(resolve(process.cwd(), "client/src/components/AppShell.tsx"), "utf8");
    const header = readFileSync(resolve(process.cwd(), "client/src/components/FloatingMenu.tsx"), "utf8");
    expect(avatars).toContain("avatars.upload");
    expect(routers).toContain("user-images/${ctx.user.id}/avatars/");
    expect(sidebar).toContain('href="/team"');
    expect(sidebar).toContain("Templete par défaut");
    expect(sidebar).not.toContain("Tests A/B");
    expect(sidebar).not.toContain("Générateur de cartes YouTube");
    expect(app).toContain('path={"/team"}');
    expect(shell).toContain("currentLabel");
    expect(header).toContain("Création assistée par IA");
  });

  it("cleans imported avatar storage and exposes admin texture packs", () => {
    const storage = readFileSync(resolve(process.cwd(), "server/storage.ts"), "utf8");
    const admin = readFileSync(resolve(process.cwd(), "client/src/pages/AdminModels.tsx"), "utf8");
    expect(storage).toContain("storageDelete");
    expect(storage).toContain("v1/storage/delete");
    expect(admin).toContain("texturePacks");
    expect(admin).toContain("Importer un pack");
    expect(admin).toContain("deleteTexturePack");
  });

  it("supports multi-layer manipulation and keeps the blank board centered", () => {
    expect(editor).toContain("selectedIds.length > 1");
    expect(editor).toContain("Calques centrés");
    expect(editor).toContain("items-center justify-center overflow-auto");
    expect(editor).toContain("widthDelta");
    expect(editor).toContain("offsetX");
  });
});
