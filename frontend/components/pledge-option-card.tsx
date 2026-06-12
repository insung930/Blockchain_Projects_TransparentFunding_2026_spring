import { ShieldCheck } from "lucide-react";
import { formatEth } from "@/lib/utils";
export function PledgeOptionCard({title,description,amountEth,disabled,onPledge}:{title:string;description?:string|null;amountEth:string;disabled?:boolean;onPledge:()=>void}){
 return <button className="pledgeOptionCard" type="button" disabled={disabled} onClick={onPledge}><span className="badge blue"><ShieldCheck size={13}/> 고정 후원 옵션</span><h3>{title}</h3><p className="muted">{description||"프로젝트 생성자가 설정한 금액으로만 후원할 수 있습니다."}</p><div className="price">{formatEth(amountEth)}<small>ETH</small></div><div className="primaryButton full">이 옵션으로 후원</div></button>;
}
