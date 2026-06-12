"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { clearToken, getMe, type User } from "@/lib/auth";
export function AuthBar(){
 const [user,setUser]=useState<User|null>(null); useEffect(()=>{getMe().then(setUser)},[]);
 if(!user) return <Link href="/login" className="secondaryButton compactButton">SNS 로그인</Link>;
 return <div className="authPill"><UserRound size={16}/><span>{user.name}</span><button className="iconButton" onClick={()=>{clearToken();location.href="/"}}><LogOut size={15}/></button></div>;
}
