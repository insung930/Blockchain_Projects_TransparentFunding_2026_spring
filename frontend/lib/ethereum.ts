import { BrowserProvider, JsonRpcProvider } from "ethers";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
declare global { interface Window { ethereum?: any } }
export function getReadProvider(){ return new JsonRpcProvider(RPC_URL, CHAIN_ID); }
export async function ensureChain(){
  if(!window.ethereum) throw new Error("MetaMask가 필요합니다. 브라우저 확장 프로그램을 확인해 주세요.");
  const chainId = `0x${CHAIN_ID.toString(16)}`;
  try{ await window.ethereum.request({ method:"wallet_switchEthereumChain", params:[{chainId}] }); }
  catch(e:any){
    if(e?.code === 4902){ await window.ethereum.request({ method:"wallet_addEthereumChain", params:[{ chainId, chainName: CHAIN_ID===31337 ? "Hardhat Localhost" : "Sepolia", nativeCurrency:{name:"ETH",symbol:"ETH",decimals:18}, rpcUrls:[RPC_URL], blockExplorerUrls: CHAIN_ID===11155111 ? ["https://sepolia.etherscan.io"] : undefined }] }); return; }
    throw e;
  }
}
export async function getSigner(){ await ensureChain(); await window.ethereum.request({ method:"eth_requestAccounts" }); const p=new BrowserProvider(window.ethereum); return p.getSigner(); }
export function shortAddress(a?:string|null){ return a ? `${a.slice(0,6)}...${a.slice(-4)}` : "-"; }
