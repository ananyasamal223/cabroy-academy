export function authToken() {
  return sessionStorage.getItem("rathi-token") || localStorage.getItem("rathi-token");
}
export function clearAuth() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem("rathi-token"); storage.removeItem("rathi-user");
  }
}
export function saveAuth(token, user, remember = true) {
  clearAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("rathi-token", token);
  storage.setItem("rathi-user", JSON.stringify(user));
}
export function saveAuthUser(user) {
  const storage = sessionStorage.getItem("rathi-token") ? sessionStorage : localStorage;
  storage.setItem("rathi-user", JSON.stringify(user));
}
