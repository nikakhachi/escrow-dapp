import { useContext, useEffect } from "react";
import { Container } from "@mui/material";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  useEffect(() => {
    (async () => {
      escrowAgentContext?.fetchAndUpdateEscrows();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <pre>{JSON.stringify(escrowAgentContext?.escrows, null, 2)}</pre>
    </Container>
  );
};
