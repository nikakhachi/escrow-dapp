import { createContext, useState, PropsWithChildren, useEffect, useContext } from "react";
import { BigNumber, ethers } from "ethers";
import { EscrowType } from "../types";
import { EscrowStatus } from "../types/enums";
import { SnackbarContext } from "./SnackbarContext";
import { CONTRACT_ADDRESS } from "../constants";
import CONTRACT_JSON from "../constants/EscrowAgentContract.json";

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
  setEventHandlers: () => void;
};

export const EscrowAgentContext = createContext<EscrowAgentContextType | null>(null);

export const EscrowAgentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const snackbarContext = useContext(SnackbarContext);

  const metamaskWallet = window.ethereum;
  const [metamaskAccount, setMetamaskAccount] = useState<string>();
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
      (metamaskWallet as any).on("accountsChanged", (accounts: any[]) => setMetamaskAccount(accounts[0]));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isMining) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "scroll";
    }
  }, [isMining]);

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
    const fetchedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_JSON.abi, signer);
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
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the agent to initiate an escrow", "error");
      }
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
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the active agent to approve the escrow", "error");
      }
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
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the active agent to reject the escrow", "error");
      }
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
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the active agent to archive the escrow", "error");
      }
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
      const escrowBuyerAddress = escrows.find((item) => item.id === escrowId)?.buyer;
      if (metamaskAccount?.toLowerCase() !== escrowBuyerAddress?.toLowerCase()) {
        return snackbarContext?.open("You should be the buyer to deposit to the escrow", "error");
      }
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
      setCurrentAgent(newAgentAddress);
    } catch (error: any) {
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the active agent to change the agent address", "error");
      }
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
      setCurrentAgentFeePercentage(newPercentageFee);
    } catch (error: any) {
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the agent to update the fee percentage", "error");
      }
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
      setWithdrawableFundsInETH(0);
    } catch (error: any) {
      if (!areAgentAndLoggedAccountEqual()) {
        return snackbarContext?.open("You should be the agent to withdraw the funds", "error");
      }
      alert(error);
    } finally {
      setIsMining(false);
    }
  };

  const setEventHandlers = () => {
    const contract = getContract(getSigner());
    contract.provider.once("block", () => {
      contract.on(
        "EscrowInitiated",
        (
          id: BigNumber,
          seller: string,
          buyer: string,
          depositAmount: BigNumber,
          status: EscrowStatus,
          agentFeePercentage: number,
          description: string,
          createdAt: BigNumber,
          updatedAt: BigNumber
        ) => {
          setEscrows((prevState) =>
            [
              {
                seller,
                buyer,
                id: id.toNumber(),
                depositAmountInEth: Number(ethers.utils.formatEther(depositAmount)),
                status,
                agentFeePercentage,
                description,
                createdAt: new Date(createdAt.toNumber() * 1000),
                updatedAt: new Date(updatedAt.toNumber() * 1000),
              },
              ...prevState,
            ].sort((a: EscrowType, b: EscrowType) => b.updatedAt.valueOf() - a.updatedAt.valueOf())
          );
          snackbarContext?.open("New Escrow has been created", "success");
        }
      );
      const escrowStatusChangeHandler = async (id: BigNumber, timestamp: BigNumber, status: EscrowStatus) => {
        setEscrows((prevState) =>
          prevState
            .map((escrow) => {
              if (escrow.id === id.toNumber()) {
                return { ...escrow, status, updatedAt: new Date(timestamp.toNumber() * 1000) };
              }
              return escrow;
            })
            .sort((a: EscrowType, b: EscrowType) => b.updatedAt.valueOf() - a.updatedAt.valueOf())
        );
        if (status === EscrowStatus.APPROVED) {
          const withdrawableFundsRes = await contract.withdrawableFunds();
          setWithdrawableFundsInETH(Number(ethers.utils.formatEther(withdrawableFundsRes)));
          snackbarContext?.open(`Escrow ID ${id.toNumber()} has been approved`, "success");
        } else if (status === EscrowStatus.DEPOSITED) {
          snackbarContext?.open(`Escrow ID ${id.toNumber()} has been deposited`, "success");
        } else if (status === EscrowStatus.ARCHIVED) {
          snackbarContext?.open(`Escrow ID ${id.toNumber()} has been archived`, "warning");
        } else if (status === EscrowStatus.REJECTED) {
          snackbarContext?.open(`Escrow ID ${id.toNumber()} has been rejected`, "error");
        }
      };
      contract.on("EscrowDeposited", (id: BigNumber, timestamp: BigNumber) =>
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.DEPOSITED)
      );
      contract.on("EscrowApproved", (id: BigNumber, timestamp: BigNumber) =>
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.APPROVED)
      );
      contract.on("EscrowRejected", (id: BigNumber, timestamp: BigNumber) =>
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.REJECTED)
      );
      contract.on("EscrowArchived", (id: BigNumber, timestamp: BigNumber) =>
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.ARCHIVED)
      );
      contract.on("FundsWithdrawn", () => setWithdrawableFundsInETH(0));
      contract.on("AgentChanged", (newAgent: string) => setCurrentAgent(newAgent));
      contract.on("AgentFeePercentageUpdated", (newAgentFeePercentage: number) => setCurrentAgentFeePercentage(newAgentFeePercentage));
    });
  };

  const areAgentAndLoggedAccountEqual = () => {
    return metamaskAccount?.toLowerCase() === currentAgent?.toLowerCase();
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
    setEventHandlers,
  };

  return <EscrowAgentContext.Provider value={value}>{children}</EscrowAgentContext.Provider>;
};
