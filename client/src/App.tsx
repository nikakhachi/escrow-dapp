import { useContext } from "react";
import { EscrowAgentContext } from "./contexts/EscrowAgentContext";
import { ConnectMetamaskView } from "./views/ConnectMetamaskView";
import { HomeView } from "./views/HomeView";
import { InvalidNetworkView } from "./views/InvalidNetworkView";
import { LoadingView } from "./views/LoadingView";
import { NoMetamaskView } from "./views/NoMetamaskView";

function App() {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return (
    <div>
      {!escrowAgentContext?.metamaskWallet ? (
        <NoMetamaskView />
      ) : escrowAgentContext?.isLoading ? (
        <LoadingView />
      ) : !escrowAgentContext?.metamaskAccount ? (
        <ConnectMetamaskView />
      ) : escrowAgentContext.isNetworkGoerli === undefined ? (
        <LoadingView />
      ) : escrowAgentContext.isNetworkGoerli === false ? (
        <InvalidNetworkView />
      ) : (
        <HomeView />
      )}
    </div>
  );
}

export default App;
