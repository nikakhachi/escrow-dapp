import { ethers } from "ethers";
import { useEffect, useState } from "react";
import EscrowJson from "./artifacts/contracts/Escrow.sol/Escrow.json";
import Escrow, { EscrowProps } from "./Escrow";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [arbiter, setArbiter] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [depositEthAmount, setDepositEthAmount] = useState(0);

  const [escrows, setEscrows] = useState<EscrowProps[]>([]);
  const [account, setAccount] = useState<any>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send("eth_requestAccounts", []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  const newContract = async () => {
    if (!signer) return alert("Signer Not Found");
    const factory = new ethers.ContractFactory(EscrowJson.abi, EscrowJson.bytecode, signer);
    const escrowContract = await factory.deploy(arbiter, beneficiary, { value: ethers.utils.parseEther(String(depositEthAmount)) });

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: depositEthAmount.toString(),
      approve: async () => {
        escrowContract.on("Approved", () => {
          console.log("DONE. APPROVED");
        });

        await approveContract(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
  };

  const approveContract = async (escrowContract: ethers.Contract, signer: ethers.providers.JsonRpcSigner) => {
    const approveTxn = await escrowContract.connect(signer).approve();
    await approveTxn.wait();
  };

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address <input type="text" value={arbiter} onChange={(e) => setArbiter(e.target.value)} />
        </label>
        <label>
          Beneficiary Address <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
        </label>
        <label>
          Deposit ETH Amount <input type="number" value={depositEthAmount} onChange={(e) => setDepositEthAmount(Number(e.target.value))} />
        </label>
        {signer ? (
          <div
            className="button"
            id="deploy"
            onClick={(e) => {
              e.preventDefault();
              newContract();
            }}
          >
            Deploy
          </div>
        ) : (
          <p>Connect with Wallet to Get Started</p>
        )}
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>
        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
