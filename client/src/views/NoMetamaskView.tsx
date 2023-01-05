import { Typography } from "@mui/material";

export const NoMetamaskView = () => (
  <div
    style={{
      width: "100vw",
      height: "100vh",
      position: "absolute",
      top: "0",
      left: "0",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Typography variant="h3" gutterBottom>
      Metamask Wallet is Missing!
    </Typography>
  </div>
);
