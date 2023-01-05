import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { string } from "hardhat/internal/core/params/argumentTypes";

describe("Escrow", function () {
  let contract: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let user1Address: string;
  let user2Address: string;
  let user3Address: string;

  let escrowData: { id: number; seller: Signer; sellerAddress: string; buyer: Signer; buyerAddress: string; depositAmount: any }[];

  this.beforeAll(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
    [user1Address, user2Address, user3Address] = await Promise.all([user1.getAddress(), user2.getAddress(), user3.getAddress()]);
    const EscrowAgent = await ethers.getContractFactory("EscrowAgent");
    contract = await EscrowAgent.deploy();
    await contract.deployed();

    escrowData = [
      {
        id: 0,
        seller: user1,
        sellerAddress: user1Address,
        buyer: user3,
        buyerAddress: user3Address,
        depositAmount: ethers.utils.parseEther("5.0"),
      },
      {
        id: 1,
        seller: user1,
        sellerAddress: user2Address,
        buyer: user3,
        buyerAddress: user3Address,
        depositAmount: ethers.utils.parseEther("4.2"),
      },
      {
        id: 2,
        seller: user2,
        sellerAddress: user2Address,
        buyer: user1,
        buyerAddress: user1Address,
        depositAmount: ethers.utils.parseEther("2.0"),
      },
    ];

    // Deploy Escrows
    await Promise.all(escrowData.map((item) => contract.initiateEscrow(item.sellerAddress, item.buyerAddress, item.depositAmount)));
  });

  it("agent should equal contract deployer", async function () {
    const agent = await contract.agent();
    expect(agent).to.eq(await owner.getAddress());
  });

  describe("forbid unauthorized calls", () => {
    it("forbid initiateEscrow as non-agent", async () => {
      await expect(contract.connect(user2).initiateEscrow(user1Address, user3Address, ethers.utils.parseEther("5.0"))).to.revertedWith(
        "Only Agent can call this function"
      );
    });

    it("forbid approveEscrow as non-agent", async () => {
      await expect(contract.connect(user3).approveEscrow(1)).to.revertedWith("Only Agent can call this function");
    });

    it("forbid rejectEscrow as non-agent", async () => {
      await expect(contract.connect(user1).rejectEscrow(0)).to.revertedWith("Only Agent can call this function");
    });

    it("forbid depositEscrow as non-buyer", async () => {
      const escrow = escrowData[0];
      await expect(contract.connect(user1).depositEscrow(escrow.id, { value: escrow.depositAmount })).to.revertedWith(
        "Only buyer can deposit to Escrow"
      );
    });

    it("forbid archiveEscrow as non-agent", async () => {
      await expect(contract.connect(user1).archiveEscrow(0)).to.revertedWith("Only Agent can call this function");
    });

    it("forbid changeAgentFeePercentage as non-agent", async () => {
      await expect(contract.connect(user1).changeAgentFeePercentage(20)).to.revertedWith("Only Agent can call this function");
    });
  });
});
