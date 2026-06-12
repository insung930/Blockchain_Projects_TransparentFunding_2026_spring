import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function signPledgeAuth(contractAddress: string, chainId: bigint, signer: any, member: string, optionIndex: number, amount: bigint, deadline: number, nonce: string) {
  const digest = ethers.solidityPackedKeccak256(
    ["address", "uint256", "address", "uint256", "uint256", "uint256", "bytes32"],
    [contractAddress, chainId, member, optionIndex, amount, deadline, nonce]
  );
  return signer.signMessage(ethers.getBytes(digest));
}

describe("MilestoneFunding v3", function () {
  async function deployFixture() {
    const [owner, authSigner, backer1, backer2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MilestoneFundingFactory");
    const factory = await Factory.deploy();
    const goal = ethers.parseEther("3");
    const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];
    const options = [ethers.parseEther("1"), ethers.parseEther("2")];
    const deadline = (await time.latest()) + 7 * 86400;
    const votingDuration = 3 * 86400;
    const tx = await factory.createProject("Test", goal, amounts, options, authSigner.address, deadline, votingDuration, 3000, 5000);
    const receipt = await tx.wait();
    const event = receipt?.logs.map((log) => { try { return factory.interface.parseLog(log); } catch { return null; } }).find((e) => e?.name === "ProjectCreated");
    const project = await ethers.getContractAt("MilestoneFunding", event?.args.project);
    const network = await ethers.provider.getNetwork();
    return { owner, authSigner, backer1, backer2, project, deadline, votingDuration, chainId: network.chainId };
  }

  it("requires an authorized member signature for pledge", async function () {
    const { authSigner, backer1, project, chainId } = await deployFixture();
    const deadline = (await time.latest()) + 600;
    const nonce = ethers.randomBytes(32);
    const sig = await signPledgeAuth(await project.getAddress(), chainId, authSigner, backer1.address, 0, ethers.parseEther("1"), deadline, ethers.hexlify(nonce));
    await expect(project.connect(backer1).pledgeOptionWithAuth(0, backer1.address, deadline, ethers.hexlify(nonce), sig, { value: ethers.parseEther("1") })).to.emit(project, "Pledged");
    expect(await project.totalFunded()).to.equal(ethers.parseEther("1"));
  });

  it("rejects arbitrary pledge amount", async function () {
    const { authSigner, backer1, project, chainId } = await deployFixture();
    const deadline = (await time.latest()) + 600;
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const sig = await signPledgeAuth(await project.getAddress(), chainId, authSigner, backer1.address, 0, ethers.parseEther("1"), deadline, nonce);
    await expect(project.connect(backer1).pledgeOptionWithAuth(0, backer1.address, deadline, nonce, sig, { value: ethers.parseEther("0.5") })).to.be.revertedWith("Invalid pledge amount");
  });

  it("rejects reused authorization", async function () {
    const { authSigner, backer1, project, chainId } = await deployFixture();
    const deadline = (await time.latest()) + 600;
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const sig = await signPledgeAuth(await project.getAddress(), chainId, authSigner, backer1.address, 0, ethers.parseEther("1"), deadline, nonce);
    await project.connect(backer1).pledgeOptionWithAuth(0, backer1.address, deadline, nonce, sig, { value: ethers.parseEther("1") });
    await expect(project.connect(backer1).pledgeOptionWithAuth(0, backer1.address, deadline, nonce, sig, { value: ethers.parseEther("1") })).to.be.revertedWith("Auth used");
  });

  it("releases milestone after approved vote", async function () {
    const { owner, authSigner, backer1, backer2, project, chainId, votingDuration } = await deployFixture();
    for (const [idx, backer, amount] of [[0, backer1, "1"], [1, backer2, "2"]] as any[]) {
      const deadline = (await time.latest()) + 600;
      const nonce = ethers.hexlify(ethers.randomBytes(32));
      const sig = await signPledgeAuth(await project.getAddress(), chainId, authSigner, backer.address, idx, ethers.parseEther(amount), deadline, nonce);
      await project.connect(backer).pledgeOptionWithAuth(idx, backer.address, deadline, nonce, sig, { value: ethers.parseEther(amount) });
    }
    await project.connect(owner).submitMilestoneEvidence(0, "ipfs://evidence");
    await project.connect(backer1).vote(0, true);
    await project.connect(backer2).vote(0, true);
    await time.increase(votingDuration + 1);
    await expect(project.connect(owner).releaseMilestone(0)).to.emit(project, "MilestoneReleased");
  });
});
