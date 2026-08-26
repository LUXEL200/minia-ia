export type GenerationCanvasRoutePayload = {
  imageUrl: string;
  prompt: string;
  style: string;
};

export function buildCanvasRoute(payload: GenerationCanvasRoutePayload) {
  const params = new URLSearchParams({
    image: payload.imageUrl,
    prompt: payload.prompt,
    style: payload.style,
    from: "generation",
  });
  return `/editor?${params.toString()}`;
}

