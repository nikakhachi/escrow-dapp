import { Button, Typography } from "@mui/material";
import { useContext } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const ConnectMetamaskView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="h3" gutterBottom>
        Connect To Metamask
      </Typography>
      <Button variant="contained" onClick={escrowAgentContext?.connectToWallet}>
        Connect
      </Button>
    </div>
  );
};
