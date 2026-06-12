import { ethers, network } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("MilestoneFundingFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log(`NETWORK=${network.name}`);
  console.log(`FACTORY_ADDRESS=${await factory.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
