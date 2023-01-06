import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { EscrowAgentProvider } from "./contexts/EscrowAgentContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SnackbarProvider>
      <EscrowAgentProvider>
        <App />
      </EscrowAgentProvider>
    </SnackbarProvider>
  </React.StrictMode>
);
