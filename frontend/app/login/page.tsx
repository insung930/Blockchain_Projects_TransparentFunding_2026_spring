import { API_URL } from "@/lib/api";
import { MessageSquareText, PenLine, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <section className="formPage">
      <div className="loginHero panel">
        <p className="eyebrow">Login</p>

        <h1
          style={{
            fontSize: "clamp(30px, 3.6vw, 44px)",
            lineHeight: 1.15,
            letterSpacing: "-0.055em",
          }}
        >
          프로젝트 등록과 후원을 시작해보세요.
        </h1>

        <p className="heroText">
          SNS 로그인으로 사용자를 확인하고, 실제 후원과 자금 집행은
          MetaMask 지갑 서명을 통해 안전하게 진행됩니다.
        </p>

        <div className="loginReasonGrid">
          <div>
            <PenLine size={20} />
            <strong>프로젝트 등록</strong>
            <span>로그인 사용자만 가능</span>
          </div>

          <div>
            <MessageSquareText size={20} />
            <strong>커뮤니티 참여</strong>
            <span>질문과 의견 작성</span>
          </div>

          <div>
            <ShieldCheck size={20} />
            <strong>후원 검증</strong>
            <span>계정과 지갑 확인</span>
          </div>
        </div>
      </div>

      <div className="panel loginPanel">
        <a className="oauthButton google" href={`${API_URL}/auth/google`}>
          Google로 계속하기
        </a>

        <a className="oauthButton kakao" href={`${API_URL}/auth/kakao`}>
          Kakao로 계속하기
        </a>

        <p className="developerNote">
          로그인 후 프로젝트 등록, 커뮤니티 참여, 후원 진행이 가능합니다.
        </p>
      </div>
    </section>
  );
}