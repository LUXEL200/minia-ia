export const EDITOR_DRAFT_VERSION = 1 as const;
export const EDITOR_DRAFT_STORAGE_PREFIX = "minia-ia:canvas-draft:v1";
/** Keep headroom for localStorage metadata and other app preferences. */
export const MAX_EDITOR_DRAFT_CHARS = 4_000_000;

export interface EditorDraftSnapshot {
  version: typeof EDITOR_DRAFT_VERSION;
  savedAt: number;
  elements: unknown[];
  bgImageUrl: string | null;
  bgColor: string;
  bgTransparent: boolean;
  bgFit: "cover" | "contain";
  canvasSize: { w: number; h: number };
  liquidTheme: "multicolor" | "orange" | "white";
}

export function getEditorDraftKey(thumbnailId: number): string {
  const scope = Number.isFinite(thumbnailId) && thumbnailId > 0 ? String(thumbnailId) : "new";
  return `${EDITOR_DRAFT_STORAGE_PREFIX}:${scope}`;
}

export function serializeEditorDraft(snapshot: EditorDraftSnapshot): string | null {
  try {
    const serialized = JSON.stringify(snapshot);
    return serialized.length <= MAX_EDITOR_DRAFT_CHARS ? serialized : null;
  } catch {
    return null;
  }
}

export function parseEditorDraft(raw: string | null): EditorDraftSnapshot | null {
  if (!raw || raw.length > MAX_EDITOR_DRAFT_CHARS) return null;

  try {
    const value = JSON.parse(raw) as Partial<EditorDraftSnapshot>;
    const canvasSize = value.canvasSize;
    const validFit = value.bgFit === "cover" || value.bgFit === "contain";
    const validLiquid = value.liquidTheme === "multicolor" || value.liquidTheme === "orange" || value.liquidTheme === "white";

    if (
      value.version !== EDITOR_DRAFT_VERSION ||
      !Number.isFinite(value.savedAt) ||
      !Array.isArray(value.elements) ||
      (value.bgImageUrl !== null && typeof value.bgImageUrl !== "string") ||
      typeof value.bgColor !== "string" ||
      typeof value.bgTransparent !== "boolean" ||
      !validFit ||
      !validLiquid ||
      !canvasSize ||
      !Number.isFinite(canvasSize.w) ||
      !Number.isFinite(canvasSize.h) ||
      canvasSize.w <= 0 ||
      canvasSize.h <= 0
    ) {
      return null;
    }

    return value as EditorDraftSnapshot;
  } catch {
    return null;
  }
}
