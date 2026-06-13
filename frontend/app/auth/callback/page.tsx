"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function OAuthCallbackPage() {
  const params = useSearchParams();
  const [message, setMessage] = useState("로그인 처리 중입니다...");

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      setMessage("로그인 토큰을 받지 못했습니다. 다시 로그인해 주세요.");
      return;
    }

    setToken(token);
    setMessage("로그인이 완료되었습니다. 메인으로 이동합니다.");

    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  }, [params]);

  return (
    <section className="formPage">
      <div className="panel">
        <p className="eyebrow">OAuth Callback</p>
        <h1>{message}</h1>
      </div>
    </section>
  );
}