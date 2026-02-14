import { getSkuConfig } from "@/lib/sku";
import { grantModules } from "@/lib/store";

export async function grantEntitlementsForSku(args: {
  assessmentId: string;
  skuId: string;
}) {
  const sku = getSkuConfig(args.skuId);
  if (!sku) throw new Error(`Unknown sku: ${args.skuId}`);

  return grantModules({
    assessmentId: args.assessmentId,
    sku: sku.id,
    modules: [...sku.modules],
  });
}

export function isPaywallBypassed() {
  return process.env.DEV_BYPASS_PAYWALL === "1";
}
