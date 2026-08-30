"use client";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export type Account = {
  id: string;
  role: "user" | "agent" | "admin";
  displayName: string;
  mobileNumber?: string | null;
  avatarUrl?: string | null;
  completedTrades: number;
  successRate: string | number;
  verified: boolean;
  blocked: boolean;
};

export type ApiOffer = {
  id: string;
  paymentMethod: "ATM QR" | "YONO Cash";
  rate: string | number;
  minInr: string | number;
  maxInr: string | number;
  availableUsdt: string | number;
  agentId: string;
  agentName: string;
  agentAvatar?: string | null;
  trades: number;
  successRate: string | number;
};

const key = (role: string) => `indiausdt-${role}-token`;

export function getToken(role: "user" | "agent" | "admin") {
  return typeof window === "undefined" ? "" : localStorage.getItem(key(role)) || "";
}

export function setToken(role: "user" | "agent" | "admin", token: string) {
  if (typeof window !== "undefined") localStorage.setItem(key(role), token);
}

export function clearToken(role: "user" | "agent" | "admin") {
  if (typeof window !== "undefined") localStorage.removeItem(key(role));
}

export async function api<T>(path: string, init: RequestInit = {}, token = ""): Promise<T> {
  if (!API_URL) throw new Error("Backend URL is not configured");
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export async function login(email: string, password: string) {
  return api<{ token: string; account: Account }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function telegramLogin() {
  const initData = (window as typeof window & { Telegram?: { WebApp?: { initData?: string } } })
    .Telegram?.WebApp?.initData;
  if (!initData) throw new Error("Open this page from the Telegram bot to continue");
  return api<{ token: string; account: Account }>("/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData }),
  });
}
