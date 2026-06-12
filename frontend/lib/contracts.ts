export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "";
export const FACTORY_ABI = [
  "event ProjectCreated(address indexed project,address indexed owner,string title,uint256 goalAmount,uint256 createdAt)",
  "function createProject(string title,uint256 goalAmount,uint256[] milestoneAmounts,uint256[] pledgeOptions,address authSigner,uint256 fundingDeadline,uint256 votingDuration,uint256 participationQuorumBps,uint256 yesThresholdBps) external returns (address)"
];
export const FUNDING_ABI = [
  "function pledgeOptionWithAuth(uint256 optionIndex,address member,uint256 deadline,bytes32 nonce,bytes signature) external payable",
  "function closeCurrentMilestoneFunding() external",
  "function refund() external",
  "function submitMilestoneEvidence(uint256 milestoneIndex,string evidenceURI) external",
  "function vote(uint256 milestoneIndex,bool support) external",
  "function releaseMilestone(uint256 milestoneIndex) external",
  "function owner() external view returns (address)",
  "function goalAmount() external view returns (uint256)",
  "function fundingDeadline() external view returns (uint256)",
  "function votingDuration() external view returns (uint256)",
  "function participationQuorumBps() external view returns (uint256)",
  "function yesThresholdBps() external view returns (uint256)",
  "function totalFunded() external view returns (uint256)",
  "function totalReleased() external view returns (uint256)",
  "function currentMilestone() external view returns (uint256)",
  "function pledges(address) external view returns (uint256)",
  "function milestonePledges(uint256,address) external view returns (uint256)",
  "function currentMilestoneFunded() external view returns (bool)",
  "function currentMilestoneFundingClosed() external view returns (bool)",
  "function getPledgeOptions() external view returns (uint256[])",
  "function getMilestones() external view returns (tuple(uint256 amount,uint256 pledgedAmount,bool fundingClosed,bool evidenceSubmitted,string evidenceURI,uint256 voteStart,uint256 voteEnd,uint256 yesVotes,uint256 noVotes,uint256 voteBaseAmount,bool released)[])"
];
