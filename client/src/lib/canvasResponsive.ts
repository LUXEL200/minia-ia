export const MOBILE_CANVAS_VIEWPORTS = [320, 375, 390] as const;

/** Keeps a 16:9 canvas inside a narrow viewport while preserving a usable minimum scale. */
export function getCanvasFitZoom(containerWidth: number, canvasWidth: number, userZoom = 1) {
  if (!Number.isFinite(containerWidth) || !Number.isFinite(canvasWidth) || canvasWidth <= 0) return userZoom;
  const availableWidth = Math.max(1, containerWidth - 16);
  const fitZoom = Math.min(1, availableWidth / canvasWidth);
  return Math.max(0.35, fitZoom) * userZoom;
}
