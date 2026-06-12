"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Contract, formatEther } from "ethers";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, LinkIcon, ShieldCheck, Vote } from "lucide-react";
import { API_URL, assetUrl } from "@/lib/api";
import { authHeaders, getMe, requireLogin, type User } from "@/lib/auth";
import { FUNDING_ABI } from "@/lib/contracts";
import { getReadProvider, getSigner, shortAddress } from "@/lib/ethereum";
import type { ChainMilestone, ChainState, Project } from "@/lib/types";
import { PledgeOptionCard } from "@/components/pledge-option-card";
import { Web3Checklist } from "@/components/web3-checklist";
import { FundingDashboard } from "@/components/funding-dashboard";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import { CommunityPanel } from "@/components/community-panel";
import { StatusBadge } from "@/components/status-badge";
import { formatEth, percent } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [chain, setChain] = useState<ChainState | null>(null);
  const [account, setAccount] = useState("");
  const [me, setMe] = useState<User | null>(null);
  const [evidenceLink, setEvidenceLink] = useState("");
  const networkReady = true;

  useEffect(() => { getMe().then(setMe); }, []);
  useEffect(() => { if (id) loadProject(); }, [id]);

  async function loadProject() {
    const res = await fetch(`${API_URL}/projects/${id}`, { cache: "no-store" });
    if (!res.ok) { toast.error("프로젝트를 불러오지 못했습니다."); return; }
    const data = await res.json();
    setProject(data);
    await loadChain(data, account);
  }

  async function loadChain(target: Project, addr?: string) {
    if (!target.contractAddress) return;
    try {
      const c = new Contract(target.contractAddress, FUNDING_ABI, getReadProvider());
      const [owner, goalAmount, totalFunded, totalReleased, currentMilestone, fundingDeadline, quorumBps, yesThresholdBps, currentMilestoneFunded, currentMilestoneFundingClosed, rawMilestones] = await Promise.all([
        c.owner(), c.goalAmount(), c.totalFunded(), c.totalReleased(), c.currentMilestone(), c.fundingDeadline(), c.participationQuorumBps(), c.yesThresholdBps(), c.currentMilestoneFunded(), c.currentMilestoneFundingClosed(), c.getMilestones()
      ]);
      const myPledge = addr ? await c.pledges(addr) : 0n;
      const myMilestonePledge = addr ? await c.milestonePledges(Number(currentMilestone), addr) : 0n;
      setChain({
        owner,
        goalAmount: formatEther(goalAmount),
        totalFunded: formatEther(totalFunded),
        totalReleased: formatEther(totalReleased),
        currentMilestone: Number(currentMilestone),
        fundingDeadline: Number(fundingDeadline),
        myPledge: formatEther(myPledge),
        myMilestonePledge: formatEther(myMilestonePledge),
        currentMilestoneFunded: Boolean(currentMilestoneFunded),
        currentMilestoneFundingClosed: Boolean(currentMilestoneFundingClosed),
        quorumBps: Number(quorumBps),
        yesThresholdBps: Number(yesThresholdBps),
        milestones: rawMilestones.map((m: any) => ({
          amount: formatEther(m.amount ?? m[0]),
          pledgedAmount: formatEther(m.pledgedAmount ?? m[1]),
          fundingClosed: Boolean(m.fundingClosed ?? m[2]),
          evidenceSubmitted: Boolean(m.evidenceSubmitted ?? m[3]),
          evidenceURI: String(m.evidenceURI ?? m[4]),
          voteStart: Number(m.voteStart ?? m[5]),
          voteEnd: Number(m.voteEnd ?? m[6]),
          yesVotes: formatEther(m.yesVotes ?? m[7]),
          noVotes: formatEther(m.noVotes ?? m[8]),
          voteBaseAmount: formatEther(m.voteBaseAmount ?? m[9]),
          released: Boolean(m.released ?? m[10])
        }))
      } as any);
    } catch (error: any) { toast.error(error?.message || "온체인 상태를 읽지 못했습니다."); }
  }

  async function connectWallet() {
    try {
      await requireLogin();
      const signer = await getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      const res = await fetch(`${API_URL}/auth/wallet`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ walletAddress: address }) });
      if (res.ok) { const data = await res.json(); localStorage.setItem("transparent_access_token", data.accessToken); setMe(data.user); }
      if (project) await loadChain(project, address);
      toast.success("MetaMask 지갑이 연결되었습니다.");
    } catch (error: any) { toast.error(error?.message || "지갑 연결에 실패했습니다."); }
  }

  async function pledgeOption(index: number) {
    if (!project?.contractAddress) return;
    try {
      await requireLogin();
      const signer = await getSigner();
      const walletAddress = await signer.getAddress();
      setAccount(walletAddress);
      toast.loading("후원 권한을 검증하는 중입니다.");
      const authRes = await fetch(`${API_URL}/projects/${project.id}/pledges/authorize`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ optionIndex: index, walletAddress }) });
      if (!authRes.ok) throw new Error(await authRes.text());
      const auth = await authRes.json();
      toast.loading("MetaMask 승인 대기 중입니다.");
      const contract = new Contract(project.contractAddress, FUNDING_ABI, signer);
      const tx = await contract.pledgeOptionWithAuth(auth.optionIndex, auth.member, auth.deadline, auth.nonce, auth.signature, { value: BigInt(auth.amountWei) });
      await tx.wait();
      toast.success("후원이 완료되었습니다. 현재 마일스톤 후원액에 반영되었습니다.");
      await loadProject();
    } catch (error: any) { toast.error(error?.shortMessage || error?.message || "후원에 실패했습니다."); }
  }

  async function closeCurrentMilestoneFunding() {
    if (!project?.contractAddress || !chain) return;
    try {
      await requireLogin();
      const signer = await getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      if (address.toLowerCase() !== project.creatorAddress.toLowerCase()) throw new Error("프로젝트 생성자 지갑만 조기 마감할 수 있습니다.");
      const contract = new Contract(project.contractAddress, FUNDING_ABI, signer);
      toast.loading("현재 마일스톤 후원을 조기 마감하는 중입니다.");
      const tx = await contract.closeCurrentMilestoneFunding();
      await tx.wait();
      await fetch(`${API_URL}/projects/${project.id}/early-close`, { method: "PATCH", headers: authHeaders() });
      toast.success("현재 마일스톤 후원이 조기 마감되었습니다. 이제 증빙 제출을 진행할 수 있습니다.");
      await loadProject();
    } catch (error: any) { toast.error(error?.shortMessage || error?.message || "조기 마감에 실패했습니다."); }
  }

  async function submitEvidenceLink() {
    if (!project?.contractAddress || !chain) return;
    try {
      await requireLogin();
      const link = evidenceLink.trim();
      if (!link) throw new Error("증빙 링크를 입력해 주세요.");
      const signer = await getSigner();
      const creatorAddress = await signer.getAddress();
      setAccount(creatorAddress);
      if (creatorAddress.toLowerCase() !== project.creatorAddress.toLowerCase()) throw new Error("프로젝트 생성자 지갑만 증빙을 제출할 수 있습니다.");
      const current = getCurrentMilestone(chain);
      if (!current) throw new Error("제출 가능한 마일스톤이 없습니다.");
      if (current.evidenceSubmitted) throw new Error("이미 현재 마일스톤의 증빙이 제출되었습니다.");
      if (Number(current.pledgedAmount) < Number(current.amount)) throw new Error("현재 마일스톤 목표 금액이 아직 달성되지 않았습니다.");
      toast.loading("증빙 링크를 컨트랙트에 기록하는 중입니다. MetaMask를 확인하세요.");
      const contract = new Contract(project.contractAddress, FUNDING_ABI, signer);
      const tx = await contract.submitMilestoneEvidence(chain.currentMilestone, link);
      await tx.wait();
      setEvidenceLink("");
      toast.success("증빙 제출이 완료되었습니다. 후원자 투표가 시작됩니다.");
      await loadProject();
    } catch (error: any) { toast.error(error?.shortMessage || error?.message || "증빙 제출에 실패했습니다."); }
  }

  async function voteCurrentMilestone(support: boolean) {
    if (!project?.contractAddress || !chain) return;
    try {
      await requireLogin();
      const signer = await getSigner();
      const voter = await signer.getAddress();
      setAccount(voter);
      toast.loading(`${support ? "찬성" : "반대"} 투표 트랜잭션 승인 대기 중입니다.`);
      const contract = new Contract(project.contractAddress, FUNDING_ABI, signer);
      const tx = await contract.vote(chain.currentMilestone, support);
      await tx.wait();
      toast.success(`${support ? "찬성" : "반대"} 투표가 완료되었습니다.`);
      await loadProject();
    } catch (error: any) { toast.error(error?.shortMessage || error?.message || "투표에 실패했습니다. 이미 투표했거나 현재 마일스톤 후원자가 아닐 수 있습니다."); }
  }

  async function releaseCurrentMilestone() {
    if (!project?.contractAddress || !chain) return;
    try {
      await requireLogin();
      const signer = await getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      if (address.toLowerCase() !== project.creatorAddress.toLowerCase()) throw new Error("프로젝트 생성자 지갑만 자금을 집행할 수 있습니다.");
      toast.loading("마일스톤 자금 집행 트랜잭션 승인 대기 중입니다.");
      const contract = new Contract(project.contractAddress, FUNDING_ABI, signer);
      const tx = await contract.releaseMilestone(chain.currentMilestone);
      await tx.wait();
      toast.success("마일스톤 자금 집행이 완료되었습니다. 다음 마일스톤 후원과 증빙 제출이 가능해집니다.");
      await loadProject();
    } catch (error: any) { toast.error(error?.shortMessage || error?.message || "자금 집행에 실패했습니다. 투표 조건을 확인해 주세요."); }
  }

  const fundingClosed = useMemo(() => chain ? Math.floor(Date.now() / 1000) > chain.fundingDeadline : false, [chain]);
  const current = chain ? getCurrentMilestone(chain) : undefined;
  const currentIndex = chain?.currentMilestone ?? 0;
  const now = Math.floor(Date.now() / 1000);
  const isCreator = !!project && !!account && account.toLowerCase() === project.creatorAddress.toLowerCase();
  const isCurrentMilestoneBacker = Number((chain as any)?.myMilestonePledge || 0) > 0;
  const currentMilestoneFunded = !!current && Number(current.pledgedAmount) >= Number(current.amount);
  const voteActive = !!current?.evidenceSubmitted && now >= current.voteStart && now <= current.voteEnd;
  const voteEnded = !!current?.evidenceSubmitted && now > current.voteEnd;
  const totalVotes = Number(current?.yesVotes || 0) + Number(current?.noVotes || 0);
  const yesPct = percent(Number(current?.yesVotes || 0), totalVotes);
  const noPct = percent(Number(current?.noVotes || 0), totalVotes);

  if (!project) return <div className="empty">프로젝트를 불러오는 중입니다.</div>;

  return <section>
    <div className="detailHero">{project.imageUrl ? <img src={assetUrl(project.imageUrl)} alt={project.title} className="detailImage" /> : <div className="detailImage placeholder">Transparent Funding</div>}<div className="detailInfo"><div className="badgeRow"><StatusBadge status={project.status} /><span className="badge green"><ShieldCheck size={13} /> 옵션 후원</span></div><h1>{project.title}</h1><p>{project.description}</p><div className="addressBox">생성자 {shortAddress(project.creatorAddress)} <span>{project.creatorAddress}</span></div>{project.contractAddress && <div className="addressBox">컨트랙트 {shortAddress(project.contractAddress)} <span>{project.contractAddress}</span></div>}<div className="detailActions"><button className="secondaryButton" onClick={connectWallet}>{account ? `${shortAddress(account)} 연결됨` : "MetaMask 연결"}</button>{project.contractAddress && <a className="ghostButton" href={`https://sepolia.etherscan.io/address/${project.contractAddress}`} target="_blank"><ExternalLink size={16} /> Explorer</a>}</div></div></div>
    <FundingDashboard project={project} chain={chain} />
    <section className="panel"><div className="sectionHeader compact"><div><p className="eyebrow small">Pledge Options</p><h2>현재 마일스톤 후원 옵션</h2><p className="muted">후원금은 현재 마일스톤에 귀속됩니다. 현재 단계 증빙 제출 후에는 다음 마일스톤 전까지 추가 후원이 제한됩니다.</p></div></div><Web3Checklist loggedIn={!!me} walletConnected={!!account} networkReady={true} />{!fundingClosed && current && !current.evidenceSubmitted && !current.fundingClosed ? <div className="pledgeOptionGrid">{project.pledgeOptions.map((option, index) => <PledgeOptionCard key={option.id} title={option.title} description={option.description} amountEth={option.amountEth} onPledge={() => pledgeOption(index)} />)}</div> : current?.evidenceSubmitted ? <div className="empty">현재 마일스톤은 증빙이 제출되어 투표가 진행 중이므로 추가 후원이 제한됩니다. 다음 마일스톤으로 넘어가면 다시 후원할 수 있습니다.</div> : current?.fundingClosed ? <div className="empty">현재 마일스톤 후원이 조기 마감되었습니다. 생성자가 증빙을 제출하면 투표가 시작됩니다.</div> : <div className="empty">펀딩 기간이 종료되었습니다.</div>}</section>
    <section className="panel"><div className="sectionHeader compact"><div><p className="eyebrow small">Milestone Timeline</p><h2>마일스톤 및 투표 현황</h2></div></div><MilestoneTimeline milestones={project.milestones} chainMilestones={chain?.milestones || []} currentMilestone={chain?.currentMilestone || project.currentMilestone || 0} /></section>
    <section className="panel evidenceVotePanel"><div className="sectionHeader compact"><div><p className="eyebrow small">Evidence & Vote</p><h2>마일스톤 증빙 제출 및 투표</h2><p className="muted">증빙은 파일 업로드가 아니라 링크 또는 텍스트 URI만 컨트랙트에 기록합니다.</p></div><span className="badge blue">현재 {Math.min(currentIndex + 1, project.milestones.length)}단계</span></div>{current && !currentMilestoneFunded && !current.evidenceSubmitted && <div className="empty">현재 마일스톤 목표 금액이 아직 달성되지 않았습니다. 현재 마일스톤 모금액은 {formatEth(current.pledgedAmount)} ETH / 목표 {formatEth(current.amount)} ETH 입니다.</div>}{currentMilestoneFunded && isCreator && current && !current.evidenceSubmitted && !current.fundingClosed && <button className="secondaryButton" type="button" onClick={closeCurrentMilestoneFunding}>현재 마일스톤 후원 조기 마감</button>}{currentMilestoneFunded && account && current && !current.evidenceSubmitted && isCreator && <div className="evidenceSubmitBox"><div><h3>현재 마일스톤 증빙 링크 제출</h3><p className="muted">결과물 URL, 문서 링크, IPFS URI, 배포 URL 등을 입력하세요. 제출 완료 시 투표가 시작됩니다.</p></div><div className="evidenceInputRow"><input className="input" value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} placeholder="예: https://github.com/... 또는 ipfs://..." /><button className="primaryButton" type="button" onClick={submitEvidenceLink}><LinkIcon size={16} /> 증빙 제출</button></div></div>}{currentMilestoneFunded && account && current && !current.evidenceSubmitted && !isCreator && <div className="empty">아직 생성자가 현재 마일스톤 증빙을 제출하지 않았습니다. 증빙 제출 후 투표가 시작됩니다.</div>}{current?.evidenceSubmitted && <div className="evidenceCompleteBox"><div className="completeIcon"><CheckCircle2 size={22} /></div><div><h3>증빙 제출 완료</h3><p className="muted">현재 마일스톤 증빙이 컨트랙트에 기록되었습니다. 다음 증빙 제출 입력창은 이 마일스톤이 집행되고 다음 단계로 넘어간 뒤 다시 표시됩니다.</p><p className="evidenceText">증빙 링크: {current.evidenceURI}</p></div></div>}{current?.evidenceSubmitted && <div className="votePanel"><div className="voteHeader"><div><h3><Vote size={18} /> 후원자 투표</h3><p className="muted">현재 마일스톤에 후원한 ETH 금액만 투표 가중치로 사용됩니다.</p></div><span className={voteActive ? "badge blue" : voteEnded ? "badge amber" : "badge"}>{voteActive ? "투표 진행 중" : voteEnded ? "투표 종료" : "투표 대기"}</span></div><div className="voteBar large"><div className="voteYes" style={{ width: `${yesPct}%` }} /><div className="voteNo" style={{ width: `${noPct}%` }} /></div><div className="voteSummaryGrid"><div><span>찬성</span><strong>{formatEth(current.yesVotes)} ETH</strong></div><div><span>반대</span><strong>{formatEth(current.noVotes)} ETH</strong></div><div><span>총 투표</span><strong>{formatEth(totalVotes)} ETH</strong></div><div><span>투표 기준 금액</span><strong>{formatEth(current.voteBaseAmount)} ETH</strong></div></div>{voteActive && isCurrentMilestoneBacker && <div className="voteActionGrid"><button className="primaryButton" type="button" onClick={() => voteCurrentMilestone(true)}>찬성 투표</button><button className="dangerButton" type="button" onClick={() => voteCurrentMilestone(false)}>반대 투표</button></div>}{voteActive && account && !isCurrentMilestoneBacker && <div className="empty">현재 마일스톤에 후원한 지갑만 투표할 수 있습니다.</div>}{voteEnded && isCreator && <button className="primaryButton" type="button" onClick={releaseCurrentMilestone}>투표 결과 기준 자금 집행</button>}{voteEnded && !isCreator && <div className="empty">투표가 종료되었습니다. 생성자가 조건 충족 여부에 따라 자금 집행을 진행할 수 있습니다.</div>}</div>}</section>
    <CommunityPanel projectId={project.id} posts={project.posts || []} me={me} onChanged={loadProject} />
  </section>;
}
function getCurrentMilestone(chain: ChainState): ChainMilestone | undefined { return chain.milestones[chain.currentMilestone]; }
