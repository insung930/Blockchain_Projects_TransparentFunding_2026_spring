import { API_URL } from "@/lib/api";
export type User = { id:number; provider:string; providerId:string; email?:string|null; name:string; avatarUrl?:string|null; walletAddress?:string|null };
const KEY = "transparent_access_token";
export function getToken(){ if(typeof window === "undefined") return ""; return localStorage.getItem(KEY) || ""; }
export function setToken(token:string){ localStorage.setItem(KEY, token); }
export function clearToken(){ localStorage.removeItem(KEY); }
export function authHeaders(): Record<string,string>{ const t=getToken(); return t ? { Authorization:`Bearer ${t}` } : {}; }
export async function getMe(): Promise<User|null>{ const t=getToken(); if(!t) return null; try{ const r=await fetch(`${API_URL}/auth/me`,{headers:authHeaders(),cache:"no-store"}); return r.ok ? r.json() : null; }catch{return null;} }
export async function requireLogin(){ const t=getToken(); if(!t) throw new Error("로그인이 필요합니다. Google 또는 Kakao로 먼저 로그인해 주세요."); return t; }
