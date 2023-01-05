import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { EscrowAgentProvider } from "./contexts/EscrowAgentContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <EscrowAgentProvider>
      <App />
    </EscrowAgentProvider>
  </React.StrictMode>
);
