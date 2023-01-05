import { createContext, useState, PropsWithChildren, useEffect } from "react";
import { ethers } from "ethers";
import EscrowAgentJson from "../artifacts/contracts/EscrowAgent.sol/EscrowAgent.json";
import { Escrow } from "../types";

const CONTRACT_ADDRESS = "0xeceb490B60Fa57E2230bAe4c6e6d3Fa0445f2C66";

type EscrowAgentContextType = {
  metamaskWallet: any;
  metamaskAccount: any;
  connectToWallet: () => void;
  isLoading: boolean;
  getSigner: () => ethers.providers.JsonRpcSigner;
  checkIfNetworkIsGoerli: () => Promise<boolean>;
  isNetworkGoerli: boolean | undefined;
  escrows: Escrow[];
  areEscrowsLoading: boolean;
  fetchAndUpdateEscrows: () => void;
};

export const EscrowAgentContext = createContext<EscrowAgentContextType | null>(null);

export const EscrowAgentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const metamaskWallet = window.ethereum;
  const [metamaskAccount, setMetamaskAccount] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworkGoerli, setIsNetworkGoerli] = useState<boolean>();
  const [contract, setContract] = useState<ethers.Contract>();
  const [isMining, setIsMining] = useState(false);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [areEscrowsLoading, setAreEscrowsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const account = await findMetaMaskAccount();
      if (account !== null) {
        setMetamaskAccount(account);
        await checkIfNetworkIsGoerli();
        setIsLoading(false);
        fetchAndUpdateEscrows();
      }
    })();
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

  const fetchAndUpdateEscrows = async () => {
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
      .sort((a: Escrow, b: Escrow) => b.updatedAt.valueOf() - a.updatedAt.valueOf());
    setEscrows(escrows);
    setAreEscrowsLoading(false);
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
    fetchAndUpdateEscrows,
  };

  return <EscrowAgentContext.Provider value={value}>{children}</EscrowAgentContext.Provider>;
};