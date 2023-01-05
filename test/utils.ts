import { Contract, BigNumber, Signer } from "ethers";
import { ethers, waffle } from "hardhat";

export const contractBalanceInWei = async (contract: Contract) => Number((await contract.provider.getBalance(contract.address)).toString());

export const bigNumberToNumber = (bigN: BigNumber) => Number(bigN.toString());

export const getBalance = async (signer: Signer, ethFormat = false) => {
  const address = await signer.getAddress();
  const balanceBigInt = await waffle.provider.getBalance(address);
  if (ethFormat) return Number(ethers.utils.formatEther(balanceBigInt));
  return bigNumberToNumber(balanceBigInt);
};
