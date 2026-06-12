import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { AuthBar } from "@/components/auth-bar";
import "./globals.css";
export const metadata: Metadata = { title:"Transparent Funding", description:"마일스톤 투표 기반 투명 크라우드 펀딩" };
export default function RootLayout({children}:{children:React.ReactNode}){ return <html lang="ko"><body><header className="topbar"><Link href="/" className="brand"><span className="brandMark"/>Transparent Funding</Link><nav className="nav"><Link href="/my-projects" className="secondaryButton compactButton">마이 프로젝트</Link><Link href="/projects/new" className="primaryButton compactButton">프로젝트 등록</Link><AuthBar/></nav></header><main className="container">{children}</main><Toaster richColors position="bottom-right"/></body></html>; }
