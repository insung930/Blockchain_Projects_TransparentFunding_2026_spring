import { CheckCircle2, CircleDashed } from "lucide-react";
export function Web3Checklist({loggedIn,walletConnected,networkReady}:{loggedIn:boolean;walletConnected:boolean;networkReady:boolean}){
 const items=[{label:"SNS 로그인",done:loggedIn},{label:"MetaMask 연결",done:walletConnected},{label:"네트워크 확인",done:networkReady}];
 return <div className="checklist">{items.map(i=><div className={`checkItem ${i.done?"done":""}`} key={i.label}>{i.done?<CheckCircle2 size={18}/>:<CircleDashed size={18}/>}<span>{i.label}</span><strong>{i.done?"완료":"필요"}</strong></div>)}</div>;
}
