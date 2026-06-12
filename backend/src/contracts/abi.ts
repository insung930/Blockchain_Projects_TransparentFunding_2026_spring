export const FUNDING_ABI = [
  'event Pledged(address indexed backer,uint256 indexed milestoneIndex,uint256 indexed optionIndex,uint256 amount,uint256 milestonePledgedAmount,uint256 totalFunded)',
  'event Refunded(address indexed backer,uint256 indexed milestoneIndex,uint256 amount)',
  'event CurrentMilestoneFundingClosed(uint256 indexed milestoneIndex,uint256 pledgedAmount,uint256 closedAt)',
  'event EvidenceSubmitted(uint256 indexed milestoneIndex,string evidenceURI,uint256 voteBaseAmount,uint256 voteEnd)',
  'event Voted(uint256 indexed milestoneIndex,address indexed voter,bool support,uint256 weight)',
  'event MilestoneReleased(uint256 indexed milestoneIndex,address indexed owner,uint256 amount)',
  'function owner() external view returns (address)',
  'function goalAmount() external view returns (uint256)',
  'function fundingDeadline() external view returns (uint256)',
  'function totalFunded() external view returns (uint256)',
  'function totalReleased() external view returns (uint256)',
  'function currentMilestone() external view returns (uint256)',
  'function currentMilestoneFunded() external view returns (bool)',
  'function currentMilestoneFundingClosed() external view returns (bool)',
  'function getMilestones() external view returns (tuple(uint256 amount,uint256 pledgedAmount,bool fundingClosed,bool evidenceSubmitted,string evidenceURI,uint256 voteStart,uint256 voteEnd,uint256 yesVotes,uint256 noVotes,uint256 voteBaseAmount,bool released)[])'
];
