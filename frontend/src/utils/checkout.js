export function checkoutCourseIds(items) {
  return [...new Set(items.flatMap((item) => item.type === "bundle" && Array.isArray(item.courses) ? item.courses : [item.id]).filter((id) => typeof id === "string" && id))];
}

export function checkoutPricing(items, promo) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const percent = Math.min(100, Math.max(0, Number(promo?.discountPercent) || 0));
  const cap = Math.max(0, Number(promo?.maxDiscount) || 0);
  const raw = subtotal * percent / 100;
  const discount = Math.round(Math.min(subtotal, cap > 0 ? Math.min(raw, cap) : raw) * 100) / 100;
  return { subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100 };
}
