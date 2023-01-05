import { ethers } from "hardhat";

async function main() {
  const EscrowAgent = await ethers.getContractFactory("EscrowAgent");
  const escrowAgent = await EscrowAgent.deploy();

  await escrowAgent.deployed();

  console.log(`Escrow Agent Contract deployed to ${escrowAgent.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
