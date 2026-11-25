const storageKey = "cabroy-lead-campaign";

export function captureLeadCampaign(search) {
  const query = new URLSearchParams(search);
  const source = query.get("utm_source")?.toLowerCase();
  const paid = ["cpc", "ppc", "paid", "paid_search", "paid_social"].includes(query.get("utm_medium")?.toLowerCase());
  let campaign;
  if (query.has("gclid") || query.has("gbraid") || query.has("wbraid") || (source === "google" && paid)) campaign = "google";
  else if (paid && ["facebook", "fb", "instagram", "ig", "meta"].includes(source)) campaign = "meta";
  try {
    if (campaign) sessionStorage.setItem(storageKey, campaign);
    else if (source) sessionStorage.removeItem(storageKey);
  } catch {
    // The enquiry can still be submitted when browser storage is unavailable.
  }
}

export function leadCampaignSource() {
  try { return sessionStorage.getItem(storageKey) || undefined; }
  catch { return undefined; }
}
