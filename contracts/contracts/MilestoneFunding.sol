// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MilestoneFunding is ReentrancyGuard {
    using MessageHashUtils for bytes32;

    uint256 public constant BPS_DENOMINATOR = 10000;

    address payable public immutable owner;
    address public immutable authSigner;

    string public title;
    uint256 public immutable goalAmount;
    uint256 public immutable fundingDeadline;
    uint256 public immutable votingDuration;
    uint256 public immutable participationQuorumBps;
    uint256 public immutable yesThresholdBps;

    uint256 public totalFunded;
    uint256 public totalReleased;
    uint256 public currentMilestone;

    struct Milestone {
        uint256 amount;
        uint256 pledgedAmount;
        bool fundingClosed;
        bool evidenceSubmitted;
        string evidenceURI;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 voteBaseAmount;
        bool released;
    }

    Milestone[] private milestones;
    uint256[] private pledgeOptions;

    mapping(address => uint256) public pledges;
    mapping(uint256 => mapping(address => uint256)) public milestonePledges;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(bytes32 => bool) public usedPledgeAuth;

    event Pledged(address indexed backer, uint256 indexed milestoneIndex, uint256 indexed optionIndex, uint256 amount, uint256 milestonePledgedAmount, uint256 totalFunded);
    event Refunded(address indexed backer, uint256 indexed milestoneIndex, uint256 amount);
    event CurrentMilestoneFundingClosed(uint256 indexed milestoneIndex, uint256 pledgedAmount, uint256 closedAt);
    event EvidenceSubmitted(uint256 indexed milestoneIndex, string evidenceURI, uint256 voteBaseAmount, uint256 voteEnd);
    event Voted(uint256 indexed milestoneIndex, address indexed voter, bool support, uint256 weight);
    event MilestoneReleased(uint256 indexed milestoneIndex, address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        address payable _owner,
        address _authSigner,
        string memory _title,
        uint256 _goalAmount,
        uint256[] memory _milestoneAmounts,
        uint256[] memory _pledgeOptions,
        uint256 _fundingDeadline,
        uint256 _votingDuration,
        uint256 _participationQuorumBps,
        uint256 _yesThresholdBps
    ) {
        require(_owner != address(0), "Invalid owner");
        require(_authSigner != address(0), "Invalid auth signer");
        require(bytes(_title).length > 0, "Empty title");
        require(_goalAmount > 0, "Invalid goal");
        require(_milestoneAmounts.length > 0, "No milestones");
        require(_pledgeOptions.length > 0, "No pledge options");
        require(_fundingDeadline > block.timestamp, "Invalid deadline");
        require(_votingDuration > 0, "Invalid voting duration");
        require(_participationQuorumBps <= BPS_DENOMINATOR, "Invalid quorum");
        require(_yesThresholdBps <= BPS_DENOMINATOR, "Invalid threshold");

        uint256 sum;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Invalid milestone amount");
            sum += _milestoneAmounts[i];
            milestones.push(Milestone({
                amount: _milestoneAmounts[i],
                pledgedAmount: 0,
                fundingClosed: false,
                evidenceSubmitted: false,
                evidenceURI: "",
                voteStart: 0,
                voteEnd: 0,
                yesVotes: 0,
                noVotes: 0,
                voteBaseAmount: 0,
                released: false
            }));
        }
        require(sum == _goalAmount, "Milestones must sum to goal");

        for (uint256 i = 0; i < _pledgeOptions.length; i++) {
            require(_pledgeOptions[i] > 0, "Invalid pledge option");
            pledgeOptions.push(_pledgeOptions[i]);
        }

        owner = _owner;
        authSigner = _authSigner;
        title = _title;
        goalAmount = _goalAmount;
        fundingDeadline = _fundingDeadline;
        votingDuration = _votingDuration;
        participationQuorumBps = _participationQuorumBps;
        yesThresholdBps = _yesThresholdBps;
    }

    receive() external payable {
        revert("Use pledge option");
    }

    function pledgeOptionWithAuth(uint256 optionIndex, address member, uint256 deadline, bytes32 nonce, bytes calldata signature) external payable nonReentrant {
        require(block.timestamp < fundingDeadline, "Funding closed");
        require(block.timestamp <= deadline, "Auth expired");
        require(member == msg.sender, "Member mismatch");
        require(optionIndex < pledgeOptions.length, "Invalid option");
        require(!usedPledgeAuth[nonce], "Auth used");
        require(currentMilestone < milestones.length, "All milestones completed");

        Milestone storage milestone = milestones[currentMilestone];
        require(!milestone.fundingClosed, "Current milestone funding closed");
        require(!milestone.evidenceSubmitted, "Current milestone voting started");

        uint256 requiredAmount = pledgeOptions[optionIndex];
        require(msg.value == requiredAmount, "Invalid pledge amount");

        bytes32 digest = keccak256(abi.encodePacked(address(this), block.chainid, member, optionIndex, requiredAmount, deadline, nonce));
        address recovered = ECDSA.recover(digest.toEthSignedMessageHash(), signature);
        require(recovered == authSigner, "Invalid auth signer");

        usedPledgeAuth[nonce] = true;
        pledges[msg.sender] += msg.value;
        milestonePledges[currentMilestone][msg.sender] += msg.value;
        milestone.pledgedAmount += msg.value;
        totalFunded += msg.value;

        emit Pledged(msg.sender, currentMilestone, optionIndex, msg.value, milestone.pledgedAmount, totalFunded);
    }

    function closeCurrentMilestoneFunding() external onlyOwner {
        require(currentMilestone < milestones.length, "All milestones completed");
        Milestone storage milestone = milestones[currentMilestone];
        require(!milestone.fundingClosed, "Already closed");
        require(!milestone.evidenceSubmitted, "Voting already started");
        require(milestone.pledgedAmount >= milestone.amount, "Milestone not funded");
        milestone.fundingClosed = true;
        emit CurrentMilestoneFundingClosed(currentMilestone, milestone.pledgedAmount, block.timestamp);
    }

    function refund() external nonReentrant {
        require(block.timestamp > fundingDeadline, "Funding not ended");
        require(currentMilestone < milestones.length, "All milestones completed");
        Milestone storage milestone = milestones[currentMilestone];
        require(!milestone.evidenceSubmitted, "Voting already started");
        require(milestone.pledgedAmount < milestone.amount, "Current milestone funded");

        uint256 amount = milestonePledges[currentMilestone][msg.sender];
        require(amount > 0, "Nothing to refund");

        milestonePledges[currentMilestone][msg.sender] = 0;
        pledges[msg.sender] -= amount;
        milestone.pledgedAmount -= amount;
        totalFunded -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Refund failed");
        emit Refunded(msg.sender, currentMilestone, amount);
    }

    function submitMilestoneEvidence(uint256 milestoneIndex, string calldata evidenceURI) external onlyOwner {
        require(currentMilestone < milestones.length, "All milestones completed");
        require(milestoneIndex == currentMilestone, "Not current milestone");
        require(milestoneIndex < milestones.length, "Invalid milestone");
        require(bytes(evidenceURI).length > 0, "Empty evidence");

        Milestone storage milestone = milestones[milestoneIndex];
        require(!milestone.released, "Already released");
        require(!milestone.evidenceSubmitted, "Evidence already submitted");
        require(milestone.pledgedAmount >= milestone.amount, "Milestone not funded");

        milestone.fundingClosed = true;
        milestone.evidenceSubmitted = true;
        milestone.evidenceURI = evidenceURI;
        milestone.voteStart = block.timestamp;
        milestone.voteEnd = block.timestamp + votingDuration;
        milestone.voteBaseAmount = milestone.pledgedAmount;

        emit EvidenceSubmitted(milestoneIndex, evidenceURI, milestone.voteBaseAmount, milestone.voteEnd);
    }

    function vote(uint256 milestoneIndex, bool support) external {
        require(milestoneIndex == currentMilestone, "Not current milestone");
        require(milestoneIndex < milestones.length, "Invalid milestone");
        require(!hasVoted[milestoneIndex][msg.sender], "Already voted");

        Milestone storage milestone = milestones[milestoneIndex];
        require(milestone.evidenceSubmitted, "No evidence");
        require(block.timestamp >= milestone.voteStart && block.timestamp <= milestone.voteEnd, "Voting closed");

        uint256 weight = milestonePledges[milestoneIndex][msg.sender];
        require(weight > 0, "Only milestone backer");

        hasVoted[milestoneIndex][msg.sender] = true;
        if (support) milestone.yesVotes += weight;
        else milestone.noVotes += weight;

        emit Voted(milestoneIndex, msg.sender, support, weight);
    }

    function releaseMilestone(uint256 milestoneIndex) external onlyOwner nonReentrant {
        require(milestoneIndex == currentMilestone, "Not current milestone");
        require(milestoneIndex < milestones.length, "Invalid milestone");

        Milestone storage milestone = milestones[milestoneIndex];
        require(milestone.evidenceSubmitted, "No evidence");
        require(block.timestamp > milestone.voteEnd, "Voting not ended");
        require(!milestone.released, "Already released");
        require(isMilestoneApproved(milestoneIndex), "Not approved");

        uint256 payoutAmount = milestone.pledgedAmount;
        milestone.released = true;
        currentMilestone += 1;
        totalReleased += payoutAmount;

        (bool sent, ) = owner.call{value: payoutAmount}("");
        require(sent, "Transfer failed");
        emit MilestoneReleased(milestoneIndex, owner, payoutAmount);
    }

    function isMilestoneApproved(uint256 milestoneIndex) public view returns (bool) {
        require(milestoneIndex < milestones.length, "Invalid milestone");
        Milestone storage milestone = milestones[milestoneIndex];
        uint256 totalVotes = milestone.yesVotes + milestone.noVotes;
        uint256 baseAmount = milestone.voteBaseAmount;
        if (baseAmount == 0) return false;
        if (totalVotes * BPS_DENOMINATOR < baseAmount * participationQuorumBps) return false;
        if (milestone.yesVotes * BPS_DENOMINATOR <= totalVotes * yesThresholdBps) return false;
        return true;
    }

    function voteStats(uint256 milestoneIndex) external view returns (uint256 yesVotes, uint256 noVotes, uint256 totalVotes, uint256 quorumRequired, bool approved) {
        require(milestoneIndex < milestones.length, "Invalid milestone");
        Milestone storage milestone = milestones[milestoneIndex];
        totalVotes = milestone.yesVotes + milestone.noVotes;
        quorumRequired = (milestone.voteBaseAmount * participationQuorumBps) / BPS_DENOMINATOR;
        return (milestone.yesVotes, milestone.noVotes, totalVotes, quorumRequired, isMilestoneApproved(milestoneIndex));
    }

    function getMilestones() external view returns (Milestone[] memory) { return milestones; }
    function getPledgeOptions() external view returns (uint256[] memory) { return pledgeOptions; }
    function milestoneCount() external view returns (uint256) { return milestones.length; }
    function pledgeOptionCount() external view returns (uint256) { return pledgeOptions.length; }

    function currentMilestoneFunded() external view returns (bool) {
        if (currentMilestone >= milestones.length) return true;
        Milestone storage milestone = milestones[currentMilestone];
        return milestone.pledgedAmount >= milestone.amount;
    }

    function currentMilestoneFundingClosed() external view returns (bool) {
        if (currentMilestone >= milestones.length) return true;
        return milestones[currentMilestone].fundingClosed;
    }

    function isGoalReached() external view returns (bool) { return totalFunded >= goalAmount; }
}
