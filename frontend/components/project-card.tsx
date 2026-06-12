import Link from "next/link";
import { Layers3, Milestone as MilestoneIcon } from "lucide-react";
import { assetUrl } from "@/lib/api";
import { formatEth, percent } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
export function ProjectCard({project}:{project:Project}){
 const progress=percent(Number(project.totalFundedEth||0),Number(project.goalEth||0));
 return <Link href={`/projects/${project.id}`} className="card projectCard"><div className="cardMediaWrap">{project.imageUrl?<img className="cardImage" src={assetUrl(project.imageUrl)} alt={project.title}/>:<div className="cardImage imageFallback">Transparent Funding</div>}<div className="mediaOverlay"/><div className="cardStatus"><StatusBadge status={project.status}/></div></div><div className="cardBody"><h3 className="cardTitle">{project.title}</h3><p className="cardDescription">{project.description}</p><div className="fundingLine"><strong>{formatEth(project.totalFundedEth)} ETH</strong><span>목표 {formatEth(project.goalEth)} ETH</span></div><div className="progress"><div className="progressFill" style={{width:`${progress}%`}}/></div><div className="cardMetaGrid"><span><Layers3 size={15}/> 후원 옵션 {project.pledgeOptions?.length||0}</span><span><MilestoneIcon size={15}/> 마일스톤 {project.milestones?.length||0}</span></div></div></Link>;
}
