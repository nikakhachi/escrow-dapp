import { createContext, useState, PropsWithChildren, useEffect } from "react";
import { ethers } from "ethers";

type EscrowAgentContextType = {
  metamaskWallet: any;
  metamaskAccount: any;
  connectToWallet: () => void;
  isLoading: boolean;
  getSigner: () => ethers.providers.JsonRpcSigner;
  checkIfNetworkIsGoerli: () => Promise<boolean>;
  isNetworkGoerli: boolean | undefined;
};

export const EscrowAgentContext = createContext<EscrowAgentContextType | null>(null);

export const EscrowAgentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const metamaskWallet = window.ethereum;
  const [metamaskAccount, setMetamaskAccount] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworkGoerli, setIsNetworkGoerli] = useState<boolean>();

  useEffect(() => {
    (async () => {
      const account = await findMetaMaskAccount();
      if (account !== null) {
        setMetamaskAccount(account);
        await checkIfNetworkIsGoerli();
        setIsLoading(false);
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

  const value = {
    metamaskWallet,
    metamaskAccount,
    connectToWallet,
    isLoading,
    getSigner,
    checkIfNetworkIsGoerli,
    isNetworkGoerli,
  };

  return <EscrowAgentContext.Provider value={value}>{children}</EscrowAgentContext.Provider>;
};
