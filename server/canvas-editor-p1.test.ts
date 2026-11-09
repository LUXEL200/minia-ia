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
});
