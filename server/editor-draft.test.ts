import { describe, expect, it } from "vitest";
import {
  EDITOR_DRAFT_VERSION,
  getEditorDraftKey,
  parseEditorDraft,
  serializeEditorDraft,
  type EditorDraftSnapshot,
} from "../client/src/lib/editorDraft";

const snapshot: EditorDraftSnapshot = {
  version: EDITOR_DRAFT_VERSION,
  savedAt: 1_725_000_000_000,
  elements: [
    { id: "text-1", type: "text", text: "Bonjour", x: 40, y: 30 },
  ],
  bgImageUrl: "data:image/png;base64,abc",
  bgColor: "#101828",
  bgTransparent: false,
  bgFit: "cover",
  canvasSize: { w: 640, h: 360 },
  liquidTheme: "multicolor",
};

describe("editorDraft", () => {
  it("serializes and parses a complete Canvas snapshot", () => {
    const raw = serializeEditorDraft(snapshot);
    expect(raw).toBeTruthy();
    expect(parseEditorDraft(raw)).toEqual(snapshot);
  });

  it("rejects corrupt, outdated and incomplete drafts", () => {
    expect(parseEditorDraft("{broken" )).toBeNull();
    expect(parseEditorDraft(JSON.stringify({ ...snapshot, version: 99 }))).toBeNull();
    expect(parseEditorDraft(JSON.stringify({ ...snapshot, canvasSize: { w: 0, h: 360 } }))).toBeNull();
  });

  it("uses an isolated storage key for new and existing thumbnails", () => {
    expect(getEditorDraftKey(0)).toBe("minia-ia:canvas-draft:v1:new");
    expect(getEditorDraftKey(42)).toBe("minia-ia:canvas-draft:v1:42");
    expect(getEditorDraftKey(-1)).toBe("minia-ia:canvas-draft:v1:new");
  });
});
