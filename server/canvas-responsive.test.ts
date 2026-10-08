import { describe, expect, it } from "vitest";
import { getCanvasFitZoom, MOBILE_CANVAS_VIEWPORTS } from "../client/src/lib/canvasResponsive";

describe("Canvas mobile responsive contract", () => {
  it.each(MOBILE_CANVAS_VIEWPORTS)("fits a 640px canvas at %ipx without collapsing below the readable minimum", viewport => {
    const zoom = getCanvasFitZoom(viewport, 640);
    expect(zoom).toBeGreaterThanOrEqual(0.35);
    expect(zoom).toBeLessThanOrEqual(1);
    expect(640 * zoom).toBeLessThanOrEqual(viewport - 16 + 0.001);
  });

  it("preserves user zoom after mobile fitting", () => {
    expect(getCanvasFitZoom(390, 640, 0.8)).toBeCloseTo(0.4675);
  });
});
