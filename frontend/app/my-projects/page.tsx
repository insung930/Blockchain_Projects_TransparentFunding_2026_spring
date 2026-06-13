"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Contract } from "ethers";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, PauseCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import { authHeaders, getMe, requireLogin, type User } from "@/lib/auth";
import { FUNDING_ABI } from "@/lib/contracts";
import { getSigner, shortAddress } from "@/lib/ethereum";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { formatEth } from "@/lib/utils";

export default function MyProjectsPage() {
  const [me, setMe] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const user = await getMe();
    setMe(user);

    if (!user) {
      setLoading(false);
      return;
    }

    const res = await fetch(`${API_URL}/projects/mine`, {
      headers: authHeaders(),
      cache: "no-store",
    });

    if (res.ok) {
      setProjects(await res.json());
    } else {
      toast.error("내 프로젝트를 불러오지 못했습니다.");
    }

    setLoading(false);
  }

  async function earlyClose(project: Project) {
    if (!project.contractAddress) {
      return toast.error("컨트랙트가 연결되지 않은 프로젝트입니다.");
    }

    try {
      await requireLogin();

      const signer = await getSigner();
      const address = await signer.getAddress();

      if (address.toLowerCase() !== project.creatorAddress.toLowerCase()) {
        throw new Error("프로젝트 생성자 지갑으로 연결해야 합니다.");
      }

      const contract = new Contract(project.contractAddress, FUNDING_ABI, signer);

      toast.loading("현재 마일스톤 후원 조기 마감 트랜잭션을 전송합니다.");

      const tx = await contract.closeCurrentMilestoneFunding();
      await tx.wait();

      await fetch(`${API_URL}/projects/${project.id}/early-close`, {
        method: "PATCH",
        headers: authHeaders(),
      });

      toast.success("현재 마일스톤 후원이 조기 마감되었습니다.");

      await load();
    } catch (error: any) {
      toast.error(
        error?.shortMessage ||
          error?.message ||
          "조기 마감에 실패했습니다. 현재 마일스톤 목표금액 달성 여부를 확인하세요."
      );
    }
  }

  if (loading) {
    return (
      <section className="formPage">
        <div className="panel">
          <h1>내 프로젝트 확인 중</h1>
          <p className="muted">잠시만 기다려 주세요.</p>
        </div>
      </section>
    );
  }

  if (!me) {
    return (
      <section className="formPage">
        <div className="panel authRequiredPanel">
          <span className="badge amber">로그인 필요</span>
          <h1>로그인이 필요합니다</h1>
          <p className="muted">
            본인이 등록한 프로젝트를 보려면 먼저 로그인해 주세요.
          </p>
          <Link href="/login" className="primaryButton">
            로그인하러 가기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow small">My Projects</p>
          <h1>내가 올린 프로젝트</h1>
          <p
            className="muted"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: 680,
            }}
          >
            작성 중인 프로젝트와 마일스톤 진행 현황을 확인할 수 있습니다.
            프로젝트 조건은 생성 후 수정할 수 없습니다.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="primaryButton"
          style={{ fontSize: 14, padding: "11px 15px" }}
        >
          새 프로젝트 등록
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="empty">아직 등록한 프로젝트가 없습니다.</div>
      ) : (
        <div className="myProjectGrid">
          {projects.map((p) => (
            <div className="panel myProjectCard" key={p.id}>
              <div className="myProjectTop">
                <div>
                  <div className="badgeRow">
                    <StatusBadge status={p.status} />
                    {p.status === "DRAFT" && (
                      <span className="badge amber">나에게만 표시</span>
                    )}
                  </div>

                  <h2>{p.title}</h2>
                  <p className="muted">{p.description}</p>
                </div>
              </div>

              <div className="statGrid">
                <div className="statCard">
                  <span>목표</span>
                  <strong>{formatEth(p.goalEth)} ETH</strong>
                </div>

                <div className="statCard">
                  <span>현재 모금</span>
                  <strong>{formatEth(p.totalFundedEth)} ETH</strong>
                </div>

                <div className="statCard">
                  <span>마일스톤</span>
                  <strong>{p.milestones.length}개</strong>
                </div>

                <div className="statCard">
                  <span>후원 옵션</span>
                  <strong>{p.pledgeOptions.length}개</strong>
                </div>
              </div>

              <div className="addressBox">
                생성자 {shortAddress(p.creatorAddress)}
                <span>{p.creatorAddress}</span>
              </div>

              {p.contractAddress ? (
                <div className="addressBox">
                  컨트랙트 {shortAddress(p.contractAddress)}
                  <span>{p.contractAddress}</span>
                </div>
              ) : (
                <div className="empty">
                  아직 컨트랙트가 연결되지 않은 작성 중 프로젝트입니다.
                </div>
              )}

              <div className="myProjectActions">
                {p.contractAddress && (
                  <Link className="secondaryButton" href={`/projects/${p.id}`}>
                    <ExternalLink size={16} /> 상세 현황
                  </Link>
                )}

                {p.contractAddress && (
                  <button className="ghostButton" onClick={() => earlyClose(p)}>
                    <PauseCircle size={16} /> 현재 마일스톤 조기 마감
                  </button>
                )}

                {p.fundingDeadline && (
                  <span className="badge">
                    <CalendarClock size={14} /> 마감{" "}
                    {new Date(Number(p.fundingDeadline) * 1000).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}