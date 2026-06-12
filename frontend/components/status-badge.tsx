export function StatusBadge({status="DRAFT"}:{status?:string}){
 const map:Record<string,{label:string;className:string}>={DRAFT:{label:"작성 중",className:"badge"},FUNDING:{label:"펀딩 중",className:"badge blue"},MILESTONE:{label:"마일스톤",className:"badge amber"},COMPLETED:{label:"완료",className:"badge green"},FAILED:{label:"실패",className:"badge red"}};
 const item=map[status]||{label:status,className:"badge"}; return <span className={item.className}>{item.label}</span>;
}
