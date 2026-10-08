export type PlanType = "free" | "pro" | "max";

export const PLAN_DEFINITIONS = {
  free: {
    id: "free" as const,
    name: "Gratuit",
    priceCents: 0,
    quota: 5,
    quotaPeriod: "lifetime" as const,
    maxParallel: 1,
    styles: ["viral", "minimalist", "dramatic"] as const,
    api: false,
    team: false,
    batch: false,
    hdExport: false,
    watermark: true,
    membersLimit: 1,
    features: ["5 miniatures au total", "3 styles", "1 génération parallèle", "Canvas de base"],
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    priceCents: 1900,
    quota: 50,
    quotaPeriod: "monthly" as const,
    maxParallel: 4,
    styles: ["viral", "mrbeast", "minimalist", "dramatic", "tech", "retro"] as const,
    api: false,
    team: false,
    batch: false,
    hdExport: true,
    watermark: false,
    membersLimit: 1,
    features: ["50 miniatures par mois", "6 styles professionnels", "4 générations parallèles", "Export HD", "Support prioritaire"],
  },
  max: {
    id: "max" as const,
    name: "Max",
    priceCents: 4900,
    quota: 1000,
    quotaPeriod: "daily-abuse-cap" as const,
    maxParallel: 4,
    styles: ["viral", "mrbeast", "minimalist", "dramatic", "tech", "retro"] as const,
    api: true,
    team: true,
    batch: true,
    hdExport: true,
    watermark: false,
    membersLimit: 10,
    features: ["Miniatures illimitées", "Tous les styles présents et futurs", "Batch Upload", "Interface équipe", "Accès API", "Support dédié"],
  },
} as const;

export type StyleKey = (typeof PLAN_DEFINITIONS.free.styles)[number] | (typeof PLAN_DEFINITIONS.pro.styles)[number];

export function getPlanDefinition(planType: string | null | undefined) {
  return PLAN_DEFINITIONS[(planType as PlanType) || "free"] ?? PLAN_DEFINITIONS.free;
}

export function isStyleAllowed(planType: string | null | undefined, style: string) {
  const plan = getPlanDefinition(planType);
  return plan.id === "max" || (plan.styles as readonly string[]).includes(style);
}

export function isQuotaPeriodExpired(plan: ReturnType<typeof getPlanDefinition>, periodStart: Date | null | undefined, now = new Date()) {
  if (!periodStart || plan.quotaPeriod === "lifetime") return false;
  if (plan.quotaPeriod === "monthly") {
    return now.getUTCFullYear() !== periodStart.getUTCFullYear() || now.getUTCMonth() !== periodStart.getUTCMonth();
  }
  return now.getTime() - periodStart.getTime() >= 24 * 60 * 60 * 1000;
}

export function planCatalog() {
  return Object.values(PLAN_DEFINITIONS).map(({ id, name, priceCents, features }) => ({ id, name, priceCents, description: features[0], features }));
}

export const UPGRADE_MESSAGE = "Cette fonctionnalité nécessite le forfait Max. Passe à Max pour la débloquer.";
