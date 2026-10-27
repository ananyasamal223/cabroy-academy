// Authoritative plan prices in INR. Never accept plan prices from the browser.
export const paymentPlans = {
  starter: { name: "Starter", monthly: 999 },
  pro: { name: "Pro", monthly: 1999 },
  business: { name: "Business", monthly: 6000 },
};
export function resolvePlanPurchase(planId, billing) {
  const plan = Object.hasOwn(paymentPlans, planId) ? paymentPlans[planId] : null;
  if (!plan || !["monthly", "yearly"].includes(billing)) return null;
  return { id: planId, name: plan.name, billing, amount: plan.monthly * (billing === "yearly" ? 12 : 1) };
}
