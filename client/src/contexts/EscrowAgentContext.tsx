import { createContext, useState, PropsWithChildren, useEffect } from "react";
import { ethers } from "ethers";
import EscrowAgentJson from "../artifacts/contracts/EscrowAgent.sol/EscrowAgent.json";
import { EscrowType } from "../types";

const CONTRACT_ADDRESS = "0x0EAd999B0fb9D9dd6F64Ef3C83F367B34312913E";

type EscrowAgentContextType = {
  metamaskWallet: any;
  metamaskAccount: any;
  connectToWallet: () => void;
  isLoading: boolean;
  getSigner: () => ethers.providers.JsonRpcSigner;
  checkIfNetworkIsGoerli: () => Promise<boolean>;
  isNetworkGoerli: boolean | undefined;
  escrows: EscrowType[];
  areEscrowsLoading: boolean;
  fetchAndUpdateContractData: () => void;
  initiateEscrow: (seller: string, buyer: string, depositAmountInETH: number, description: string) => void;
  isMining: boolean;
  approveEscrow: (escrowId: number) => void;
  rejectEscrow: (escrowId: number) => void;
  archiveEscrow: (escrowId: number) => void;
  depositEscrow: (escrowId: number, depositAmountInETH: number) => void;
  changeAgent: (newAgentAddress: string) => void;
  updateAgentPercentageFee: (newPercentageFee: number) => void;
  withdrawFunds: () => void;
  currentAgent?: string;
  currentAgentFeePercentage?: number;
  withdrawableFundsInETH?: number;
};

export const EscrowAgentContext = createContext<EscrowAgentContextType | null>(null);

export const EscrowAgentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const metamaskWallet = window.ethereum;
  const [metamaskAccount, setMetamaskAccount] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworkGoerli, setIsNetworkGoerli] = useState<boolean>();
  const [contract, setContract] = useState<ethers.Contract>();
  const [isMining, setIsMining] = useState(false);
  const [escrows, setEscrows] = useState<EscrowType[]>([]);
  const [currentAgentFeePercentage, setCurrentAgentFeePercentage] = useState<number>();
  const [currentAgent, setCurrentAgent] = useState<string>();
  const [withdrawableFundsInETH, setWithdrawableFundsInETH] = useState<number>();
  const [areEscrowsLoading, setAreEscrowsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const account = await findMetaMaskAccount();
      if (account !== null) {
        setMetamaskAccount(account);
        await checkIfNetworkIsGoerli();
        setIsLoading(false);
        fetchAndUpdateContractData();
      }
    })();
    setTimeout(() => {
      setIsMining(true);
      setTimeout(() => {
        setIsMining(false);
      }, 5000);
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findMetaMaskAccount = async () => {
    try {
      if (!metamaskWallet || !metamaskWallet.request) return null;

      const accounts = await metamaskWallet.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        return account;
      } else {
        setIsLoading(false);
        console.error("No authorized account found");
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const connectToWallet = async () => {
    if (!metamaskWallet || !metamaskWallet.request) return null;

    const accounts = await metamaskWallet.request({
      method: "eth_requestAccounts",
    });

    setMetamaskAccount(accounts[0]);
    checkIfNetworkIsGoerli();
    return accounts[0];
  };

  const getSigner = () => {
    const provider = new ethers.providers.Web3Provider(metamaskWallet);
    const signer = provider.getSigner();
    return signer;
  };

  const checkIfNetworkIsGoerli = async () => {
    const provider = new ethers.providers.Web3Provider(metamaskWallet);
    const network = await provider.getNetwork();
    if (network.name === "goerli") {
      setIsNetworkGoerli(true);
    } else {
      setIsNetworkGoerli(false);
    }
    return network.name === "goerli";
  };

  //
  //
  // CONTRACT FUNCTIONS BELOW
  //
  //

  const getContract = (signer: ethers.Signer | ethers.providers.Provider | undefined): ethers.Contract => {
    if (contract) return contract;
    const fetchedContract = new ethers.Contract(CONTRACT_ADDRESS, EscrowAgentJson.abi, signer);
    setContract(fetchedContract);
    return fetchedContract;
  };

  const fetchAndUpdateContractData = async () => {
    setAreEscrowsLoading(true);
    const contract = getContract(getSigner());
    const escrowsRaw = await contract.getAllEscrows();
    const escrows = escrowsRaw
      .map((item: any) => ({
        seller: item.seller,
        buyer: item.buyer,
        id: item.id.toNumber(),
        depositAmountInEth: Number(ethers.utils.formatEther(item.depositAmount)),
        status: item.status,
        agentFeePercentage: item.agentFeePercentage,
        description: item.description,
        createdAt: new Date(item.createdAt.toNumber() * 1000),
        updatedAt: new Date(item.updatedAt.toNumber() * 1000),
      }))
      .sort((a: EscrowType, b: EscrowType) => b.updatedAt.valueOf() - a.updatedAt.valueOf());
    setEscrows(escrows);
    const currentAgentRes = await contract.agent();
    const currentAgentFeePercentageRes = await contract.agentFeePercentage();
    const withdrawableFundsRes = await contract.withdrawableFunds();
    setCurrentAgent(currentAgentRes);
    setCurrentAgentFeePercentage(currentAgentFeePercentageRes);
    setWithdrawableFundsInETH(Number(ethers.utils.formatEther(withdrawableFundsRes)));
    setAreEscrowsLoading(false);
  };

  const initiateEscrow = async (seller: string, buyer: string, depositAmountInETH: number, description: string) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.initiateEscrow(seller, buyer, ethers.utils.parseEther(String(depositAmountInETH)), description);
      setIsMining(true);
      await txn.wait();
    } catch (error) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const approveEscrow = async (escrowId: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.approveEscrow(escrowId);
      setIsMining(true);
      await txn.wait();
    } catch (error) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const rejectEscrow = async (escrowId: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.rejectEscrow(escrowId);
      setIsMining(true);
      await txn.wait();
    } catch (error) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const archiveEscrow = async (escrowId: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.archiveEscrow(escrowId);
      setIsMining(true);
      await txn.wait();
    } catch (error) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const depositEscrow = async (escrowId: number, depositAmountInETH: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.depositEscrow(escrowId, { value: ethers.utils.parseEther(String(depositAmountInETH)) });
      setIsMining(true);
      await txn.wait();
    } catch (error: any) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const changeAgent = async (newAgentAddress: string) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.changeAgent(newAgentAddress);
      setIsMining(true);
      await txn.wait();
    } catch (error: any) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const updateAgentPercentageFee = async (newPercentageFee: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.changeAgentFeePercentage(newPercentageFee);
      setIsMining(true);
      await txn.wait();
    } catch (error: any) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const withdrawFunds = async () => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.withdrawFunds();
      setIsMining(true);
      await txn.wait();
    } catch (error: any) {
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const value = {
    metamaskWallet,
    metamaskAccount,
    connectToWallet,
    isLoading,
    getSigner,
    checkIfNetworkIsGoerli,
    isNetworkGoerli,
    escrows,
    areEscrowsLoading,
    fetchAndUpdateContractData,
    initiateEscrow,
    isMining,
    approveEscrow,
    rejectEscrow,
    archiveEscrow,
    depositEscrow,
    changeAgent,
    updateAgentPercentageFee,
    withdrawFunds,
    currentAgent,
    currentAgentFeePercentage,
    withdrawableFundsInETH,
  };

  return <EscrowAgentContext.Provider value={value}>{children}</EscrowAgentContext.Provider>;
};
