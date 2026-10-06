import { getClient } from "./supabase.js";
import { path } from "./config.js";
let currentSession = null;
let initialized = false;
const listeners = new Set();
export const session = () => currentSession;
export const onAuth = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
export async function initAuth(force = false) {
  if (initialized) return;
  let token = false;
  try {
    token = Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k));
  } catch {
    /* no persistent session */
  }
  if (
    !force &&
    !token &&
    !location.hash.includes("access_token") &&
    !new URL(location.href).searchParams.has("code")
  )
    return;
  const client = await getClient();
  initialized = true;
  const { data } = await client.auth.getSession();
  currentSession = data.session;
  client.auth.onAuthStateChange((event, next) => {
    currentSession = next;
    // Database requests must run outside the SDK's synchronous auth callback.
    setTimeout(() => {
      listeners.forEach((fn) => fn(next, event));
      document.dispatchEvent(new CustomEvent("authchange"));
    }, 0);
  });
}
export async function signIn(email, password) {
  await initAuth(true);
  const { error } = await (
    await getClient()
  ).auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function signUp(email, password, metadata) {
  await initAuth(true);
  const { data, error } = await (
    await getClient()
  ).auth.signUp({
    email,
    password,
    options: { data: metadata, emailRedirectTo: path("pages/login.html") },
  });
  if (error) throw error;
  return data;
}
export async function signOut() {
  const { error } = await (await getClient()).auth.signOut();
  if (error) throw error;
  currentSession = null;
}
export async function recover(email) {
  const { error } = await (
    await getClient()
  ).auth.resetPasswordForEmail(email, {
    redirectTo: path("pages/redefinir-senha.html"),
  });
  if (error) throw error;
}
export async function resetPassword(password) {
  const { error } = await (await getClient()).auth.updateUser({ password });
  if (error) throw error;
}
export async function google() {
  const { error } = await (
    await getClient()
  ).auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: path("pages/escolher-nome.html") },
  });
  if (error) throw error;
}
export async function magic(email) {
  const { error } = await (
    await getClient()
  ).auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: path("pages/escolher-nome.html"),
    },
  });
  if (error) throw error;
}
