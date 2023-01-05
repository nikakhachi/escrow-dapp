import { CircularProgress } from "@mui/material";

export const LoadingView = () => (
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
    }}
  >
    <CircularProgress />
  </div>
);
