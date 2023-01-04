import { ethers } from "ethers";
import { useEffect, useState } from "react";
import deploy from "./deploy";
import Escrow, { EscrowProps } from "./Escrow";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [arbiter, setArbiter] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [depositAmountInWei, setDepositAmountInWei] = useState(0);

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

  async function newContract() {
    const escrowContract = await deploy(signer, arbiter, beneficiary, ethers.BigNumber.from(depositAmountInWei));

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: depositAmountInWei.toString(),
    };

    setEscrows([...escrows, escrow]);
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" value={arbiter} onChange={(e) => setArbiter(e.target.value)} />
        </label>

        <label>
          Beneficiary Address
          <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
        </label>

        <label>
          Deposit Amount (in Wei)
          <input type="text" value={depositAmountInWei} onChange={(e) => setDepositAmountInWei(Number(e.target.value))} />
        </label>

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
