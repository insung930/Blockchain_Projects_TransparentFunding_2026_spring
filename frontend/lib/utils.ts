import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...i:ClassValue[]){ return twMerge(clsx(i)); }
export function percent(v:number,t:number){ if(!Number.isFinite(v)||!Number.isFinite(t)||t<=0) return 0; return Math.min(100,Math.max(0,(v/t)*100)); }
export function formatEth(v?:string|number|null,d=4){ const n=Number(v||0); if(!Number.isFinite(n)) return "0"; return n.toLocaleString(undefined,{maximumFractionDigits:d}); }
