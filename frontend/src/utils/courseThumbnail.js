export function courseThumbnail(value, apiBaseURL) {
  const source = typeof value === "string" ? value.trim() : "";
  if (/^\/?uploads\//i.test(source)) {
    const base = new URL(apiBaseURL || "/api", window.location.origin);
    return new URL("/" + source.replace(/^\//, ""), base.origin).href;
  }
  return source;
}
