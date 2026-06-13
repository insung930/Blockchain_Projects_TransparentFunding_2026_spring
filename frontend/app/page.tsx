import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  Landmark,
  Milestone,
  ShieldCheck,
  Vote,
  Wallet,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/project-card";

async function getProjects(): Promise<Project[]> {
  try {
    const r = await fetch(`${API_URL}/projects`, { cache: "no-store" });
    return r.ok ? r.json() : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const projects = await getProjects();

  const values = [
    {
      icon: Landmark,
      title: "Escrow 보관",
      text: "후원금은 바로 지급되지 않고 스마트 컨트랙트에 보관됩니다.",
    },
    {
      icon: Milestone,
      title: "마일스톤 증빙",
      text: "프로젝트 진행 단계마다 결과물과 증빙 자료를 제출합니다.",
    },
    {
      icon: Vote,
      title: "후원자 투표",
      text: "후원자는 제출된 증빙을 확인한 뒤 집행 여부를 투표합니다.",
    },
    {
      icon: ShieldCheck,
      title: "승인 후 집행",
      text: "투표가 통과된 마일스톤 금액만 프로젝트 생성자에게 지급됩니다.",
    },
  ];

  const keywordCard = (
    title: string,
    text: string,
    Icon: any,
    gridColumn: string,
    gridRow: string
  ) => (
    <div
      style={{
        gridColumn,
        gridRow,
        height: 96,
        borderRadius: 22,
        background: "#ffffff",
        border: "1px solid var(--line)",
        boxShadow: "0 10px 26px rgba(15,23,42,.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "10px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 14,
          background: "var(--blue-soft)",
          color: "var(--blue)",
          display: "grid",
          placeItems: "center",
          marginBottom: 7,
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      <strong
        style={{
          display: "block",
          fontSize: 16,
          lineHeight: 1.15,
          color: "var(--navy)",
          marginBottom: 4,
        }}
      >
        {title}
      </strong>

      <span
        style={{
          display: "block",
          fontSize: 11.5,
          lineHeight: 1.35,
          color: "var(--muted)",
        }}
      >
        {text}
      </span>
    </div>
  );

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Milestone-based Crowdfunding</p>

          <h1
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.12,
              letterSpacing: "-0.055em",
            }}
          >
            후원금이 어디에 쓰이는지, 끝까지 확인할 수 있는 펀딩
          </h1>

          <p className="heroText">
            후원금은 스마트 컨트랙트에 안전하게 보관되고, 프로젝트가
            마일스톤을 달성하면 후원자 투표를 거쳐 단계별로 집행됩니다.
          </p>

          <div className="heroActions">
            <Link href="/projects/new" className="primaryButton">
              프로젝트 등록 <ArrowRight size={17} />
            </Link>
            <a href="#projects" className="secondaryButton">
              프로젝트 보기
            </a>
          </div>
        </div>

        <div
          className="heroVisual"
          style={{
            padding: 26,
            minHeight: 360,
            display: "grid",
            alignContent: "center",
            gap: 14,
            overflow: "hidden",
          }}
        >

          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "96px 104px 96px",
              gap: 12,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "16%",
                right: "16%",
                top: "50%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(37,99,235,.25), transparent)",
                zIndex: 1,
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "14%",
                bottom: "14%",
                left: "50%",
                width: 1,
                background:
                  "linear-gradient(180deg, transparent, rgba(37,99,235,.25), transparent)",
                zIndex: 1,
              }}
            />

            {keywordCard("후원", "옵션 선택", Wallet, "1", "1")}
            {keywordCard("증빙", "결과 제출", FileCheck2, "3", "1")}

            <div
              style={{
                gridColumn: "2",
                gridRow: "2",
                height: 104,
                borderRadius: 28,
                background: "linear-gradient(135deg, var(--navy), #1d4ed8)",
                color: "#ffffff",
                boxShadow: "0 20px 48px rgba(37,99,235,.28)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: 12,
                position: "relative",
                zIndex: 3,
                border: "5px solid rgba(255,255,255,.82)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 16,
                  background: "rgba(255,255,255,.16)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 8,
                  flexShrink: 0,
                }}
              >
                <Landmark size={20} />
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: 18,
                  lineHeight: 1.15,
                  marginBottom: 4,
                }}
              >
                Escrow
              </strong>

              <span
                style={{
                  display: "block",
                  fontSize: 11.5,
                  lineHeight: 1.3,
                  color: "rgba(255,255,255,.78)",
                }}
              >
                자금 보관
              </span>
            </div>

            {keywordCard("투표", "집행 승인", Vote, "1", "3")}
            {keywordCard("집행", "승인 금액 지급", ShieldCheck, "3", "3")}
          </div>

         
        </div>
      </div>

      <div className="valueGrid">
        {values.map((i) => (
          <div className="valueCard" key={i.title}>
            <i.icon size={22} />
            <strong>{i.title}</strong>
            <span>{i.text}</span>
          </div>
        ))}
      </div>

      <div className="sectionHeader" id="projects">
        <div>
          <p className="eyebrow small">Projects</p>
          <h2>프로젝트 목록</h2>
        </div>
        <span className="muted">{projects.length}개 프로젝트</span>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          등록된 프로젝트가 없습니다. 첫 투명 펀딩 프로젝트를 만들어보세요.
        </div>
      ) : (
        <div className="grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}