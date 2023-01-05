import { Typography } from "@mui/material";

export const InvalidNetworkView = () => (
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
      Please switch to <span style={{ textDecoration: "underline", fontStyle: "italic" }}>Goerli test network</span> and refresh the page
    </Typography>
  </div>
);
