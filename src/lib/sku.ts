export type ModuleId = "deep_report" | "aspects" | "suffix" | "level";
export type SkuId = "deep_report_v1";

export type SkuConfig = {
  id: SkuId;
  nameZh: string;
  currency: "usd" | "cny";
  unitAmount: number; // smallest currency unit (cents/fen)
  modules: readonly ModuleId[];
};

export const SKUS: Record<SkuId, SkuConfig> = {
  deep_report_v1: {
    id: "deep_report_v1",
    nameZh: "RG16 深度报告",
    currency: "cny",
    unitAmount: 999,
    modules: ["deep_report", "aspects", "suffix", "level"],
  },
};

export function getSkuConfig(id: string): SkuConfig | null {
  if (id in SKUS) return SKUS[id as SkuId];
  return null;
}
