import { supabase } from "@/integrations/supabase/client";

export type ProductType = 'loan' | 'savings';

// Resolve the asset account (fund source) for a given product + payment method.
// Tries to match via payment_types.code (case-insensitive) against mappings saved in product_fund_source_mappings.
export const resolveFundSourceAccount = async (args: {
  productId: string;
  productType: ProductType;
  paymentMethodCode?: string | null;
}): Promise<string | null> => {
  const { productId, productType, paymentMethodCode } = args;
  if (!productId || !paymentMethodCode) return null;

  const code = paymentMethodCode.toLowerCase();

  // 1) Find payment type by code (case-insensitive)
  const { data: pt, error: ptErr } = await supabase
    .from('payment_types')
    .select('*')
    .ilike('code', code)
    .maybeSingle();

  // 2) Load all mappings for product
  const { data: mappings, error: mapErr } = await supabase
    .from('product_fund_source_mappings')
    .select('channel_id, channel_name, account_id')
    .eq('product_id', productId)
    .eq('product_type', productType);

  if (mapErr) {
    console.warn('resolveFundSourceAccount: mappings fetch failed', mapErr);
    return null;
  }

  if (!mappings || mappings.length === 0) return null;

  // 3) Try match by payment type id first
  if (pt && !ptErr) {
    const m = mappings.find(m => m.channel_id === pt.id);
    if (m) return m.account_id;
  }

  // 4) Fallback: try by channel_name matching code or name loosely
  const m2 = mappings.find(m =>
    m.channel_name?.toLowerCase() === code ||
    m.channel_name?.toLowerCase().includes(code)
  );
  if (m2) return m2.account_id;

  return null;
};
