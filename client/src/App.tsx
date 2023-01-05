import { useContext } from "react";
import { EscrowAgentContext } from "./contexts/EscrowAgentContext";

function App() {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return (
    <div>
      {!escrowAgentContext?.metamaskWallet ? (
        <p>no metamask</p>
      ) : escrowAgentContext?.isLoading ? (
        <p>loading</p>
      ) : !escrowAgentContext?.metamaskAccount ? (
        <p onClick={escrowAgentContext.connectToWallet}>connect to metamask</p>
      ) : escrowAgentContext.isNetworkGoerli === undefined ? (
        <p>loading</p>
      ) : escrowAgentContext.isNetworkGoerli === false ? (
        <p>switch to goerli network</p>
      ) : (
        <p>home</p>
      )}
    </div>
  );
}

export default App;
