// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MilestoneFunding.sol";

contract MilestoneFundingFactory {
    address[] private projects;

    event ProjectCreated(address indexed project, address indexed owner, string title, uint256 goalAmount, uint256 createdAt);

    function createProject(
        string calldata title,
        uint256 goalAmount,
        uint256[] calldata milestoneAmounts,
        uint256[] calldata pledgeOptions,
        address authSigner,
        uint256 fundingDeadline,
        uint256 votingDuration,
        uint256 participationQuorumBps,
        uint256 yesThresholdBps
    ) external returns (address) {
        MilestoneFunding project = new MilestoneFunding(
            payable(msg.sender),
            authSigner,
            title,
            goalAmount,
            milestoneAmounts,
            pledgeOptions,
            fundingDeadline,
            votingDuration,
            participationQuorumBps,
            yesThresholdBps
        );
        projects.push(address(project));
        emit ProjectCreated(address(project), msg.sender, title, goalAmount, block.timestamp);
        return address(project);
    }

    function getProjects() external view returns (address[] memory) {
        return projects;
    }

    function projectCount() external view returns (uint256) {
        return projects.length;
    }
}
