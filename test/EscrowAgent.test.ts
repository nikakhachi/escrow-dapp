import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { bigNumberToNumber, contractBalanceInWei, getBalance } from "./utils";

enum EscrowStatus {
  PENDING,
  DEPOSITED,
  APPROVED,
  REJECTED,
  ARCHIVED,
}

describe("Escrow Agent Contract", function () {
  let contract: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let user1Address: string;
  let user2Address: string;
  let user3Address: string;

  let escrowData: { id: number; seller: Signer; sellerAddress: string; buyer: Signer; buyerAddress: string; depositAmount: BigNumber }[];

  const parsed5Ether = ethers.utils.parseEther("5.0");
  const parsed4Ether = ethers.utils.parseEther("4.0");
  const parsed3Ether = ethers.utils.parseEther("3.0");

  this.beforeEach(async () => {
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
        depositAmount: parsed5Ether,
      },
      {
        id: 1,
        seller: user1,
        sellerAddress: user2Address,
        buyer: user3,
        buyerAddress: user3Address,
        depositAmount: parsed4Ether,
      },
      {
        id: 2,
        seller: user2,
        sellerAddress: user2Address,
        buyer: user1,
        buyerAddress: user1Address,
        depositAmount: parsed3Ether,
      },
    ];

    // Deploy Escrows
    await Promise.all(
      escrowData.map((item) =>
        contract.initiateEscrow(item.sellerAddress, item.buyerAddress, item.depositAmount, `test escrow #${item.id}`)
      )
    );
  });

  it("agent should equal contract deployer", async function () {
    const agent = await contract.agent();
    expect(agent).to.eq(await owner.getAddress());
  });

  describe("initiateEscrow", () => {
    it("forbid as non-agent", async () => {
      await expect(contract.connect(user2).initiateEscrow(user1Address, user3Address, parsed5Ether, "test")).to.revertedWith(
        "Only Agent can call this function"
      );
    });
    it("don't allow same seller and buyer", async () => {
      await expect(contract.initiateEscrow(user1Address, user1Address, parsed4Ether, "test")).to.revertedWith(
        "Buyer and Seller should be Different"
      );
    });
    it("escrow should be added to array", async () => {
      await contract.initiateEscrow(user1Address, user2Address, parsed5Ether, "test");
      const newEscrow = await contract.getEscrowById(3);
      expect(newEscrow.id.toNumber()).to.eq(3);
      expect(newEscrow.seller).to.eq(user1Address);
      expect(newEscrow.buyer).to.eq(user2Address);
      expect(newEscrow.status).to.eq(EscrowStatus.PENDING);
      expect(newEscrow.agentFeePercentage).to.be.a("number");
    });
  });

  describe("depositEscrow", () => {
    it("forbid as non-buyer", async () => {
      const escrow = escrowData[0];
      await expect(contract.connect(user1).depositEscrow(escrow.id, { value: escrow.depositAmount })).to.revertedWith(
        "Only buyer can deposit to Escrow"
      );
    });
    it("forbid deposit on archived escrow", async () => {
      const escrow = escrowData[1];
      await contract.archiveEscrow(escrow.id);
      await expect(contract.connect(escrow.buyer).depositEscrow(escrow.id, { value: escrow.depositAmount })).to.revertedWith(
        "Deposit is only allowed on pending Escrow"
      );
    });
    it("forbid deposit with different amount", async () => {
      const escrow = escrowData[0];
      await expect(contract.connect(escrow.buyer).depositEscrow(escrow.id, { value: parsed3Ether })).to.revertedWith(
        "Deposit must be equal to escrow's needed amount"
      );
    });
    it("deposit on escrow", async () => {
      const escrow = escrowData[0];
      await contract.connect(escrow.buyer).depositEscrow(escrow.id, { value: escrow.depositAmount });
      const depositedEscrow = await contract.getEscrowById(escrow.id);
      const contractBalance = await contract.provider.getBalance(contract.address);
      expect(depositedEscrow.status).to.eq(EscrowStatus.DEPOSITED);
      expect(bigNumberToNumber(contractBalance) === bigNumberToNumber(escrow.depositAmount));
    });
  });

  describe("approveEscrow", () => {
    it("forbid approveEscrow as non-agent", async () => {
      const escrow = escrowData[0];
      await expect(contract.connect(user2).approveEscrow(escrow.id)).to.revertedWith("Only Agent can call this function");
    });
    it("forbid approve on escrow with status other than 'deposited'", async () => {
      const escrow = escrowData[0];
      await expect(contract.approveEscrow(escrow.id)).to.revertedWith("You can only approve Escrow with deposited status");
    });
    it("approve escrow", async () => {
      const escrow = escrowData[0];
      const agentFeePercentage = (await contract.getEscrowById(escrow.id)).agentFeePercentage;
      let sellersBalanceBeforeApproval = await getBalance(escrow.seller);
      await contract.connect(escrow.buyer).depositEscrow(escrow.id, { value: escrow.depositAmount });
      await contract.approveEscrow(escrow.id);
      let sellersBalanceAfterApproval = await getBalance(escrow.seller);
      const contractBalance = await contractBalanceInWei(contract);
      const approvedEscrow = await contract.getEscrowById(escrow.id);
      expect((bigNumberToNumber(escrow.depositAmount) * agentFeePercentage) / 100).to.eq(contractBalance);
      expect(sellersBalanceBeforeApproval + (bigNumberToNumber(escrow.depositAmount) * (100 - agentFeePercentage)) / 100).to.eq(
        sellersBalanceAfterApproval
      );
      expect(approvedEscrow.status).to.eq(EscrowStatus.APPROVED);
    });
  });

  describe("rejectEscrow", () => {
    it("forbid rejectEscrow as non-agent", async () => {
      const escrow = escrowData[0];
      await expect(contract.connect(user2).rejectEscrow(escrow.id)).to.revertedWith("Only Agent can call this function");
    });
    it("forbid reject on escrow with status other than 'deposited'", async () => {
      const escrow = escrowData[0];
      await expect(contract.rejectEscrow(escrow.id)).to.revertedWith("You can only reject Escrow with deposited status");
    });
    it("reject escrow", async () => {
      const escrow = escrowData[1];
      await contract.connect(escrow.buyer).depositEscrow(escrow.id, { value: escrow.depositAmount });
      let buyersBalanceAfterDeposit = await getBalance(escrow.buyer);
      await contract.rejectEscrow(escrow.id);
      let buyersBalanceAfterRejection = await getBalance(escrow.buyer);
      const contractBalance = await contractBalanceInWei(contract);
      const rejectedEscrow = await contract.getEscrowById(escrow.id);
      expect(contractBalance).to.eq(0);
      expect(buyersBalanceAfterDeposit + bigNumberToNumber(escrow.depositAmount)).to.eq(buyersBalanceAfterRejection);
      expect(rejectedEscrow.status).to.eq(EscrowStatus.REJECTED);
    });
  });

  describe("archiveEscrow", () => {
    it("forbid archiveEscrow as non-agent", async () => {
      const escrow = escrowData[1];
      await expect(contract.connect(user1).archiveEscrow(escrow.id)).to.revertedWith("Only Agent can call this function");
    });
    it("forbid archive on active escrow", async () => {
      const escrow = escrowData[0];
      await contract.connect(escrow.buyer).depositEscrow(escrow.id, { value: escrow.depositAmount });
      await expect(contract.archiveEscrow(escrow.id)).to.revertedWith("Can't archive active Escrow");
    });
    it("archive escrow", async () => {
      const escrow = escrowData[0];
      await contract.archiveEscrow(escrow.id);
      const archivedEscrow = await contract.getEscrowById(escrow.id);
      expect(archivedEscrow.status).to.eq(EscrowStatus.ARCHIVED);
    });
  });

  describe("changeAgentFeePercentage", () => {
    it("forbid as non-agent", async () => {
      await expect(contract.connect(user1).changeAgentFeePercentage(20)).to.revertedWith("Only Agent can call this function");
    });
    it("forbid value outside 0-99 range", async () => {
      await expect(contract.changeAgentFeePercentage(100)).to.revertedWith("Value should be non-decimal in range of 0 and 99");
    });
    it("change agent fee percentage", async () => {
      const newFee = 24;
      await contract.changeAgentFeePercentage(newFee);
      const fee = await contract.agentFeePercentage();
      expect(fee).to.eq(newFee);
    });
  });
});
