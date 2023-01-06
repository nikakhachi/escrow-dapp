import { useContext, useEffect } from "react";
import { Container, CircularProgress, Grid } from "@mui/material";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import Escrow from "../components/Escrow";
import AddEscrowForm from "../components/AddEscrowForm";
import AdminFunctions from "../components/AdminFunctions";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  useEffect(() => {
    (async () => {
      escrowAgentContext?.fetchAndUpdateContractData();
      escrowAgentContext?.setEventHandlers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container sx={{ paddingTop: "1rem" }}>
      {escrowAgentContext?.areEscrowsLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={5}>
          <AdminFunctions />
          <AddEscrowForm />
          {escrowAgentContext?.escrows.map((escrow) => (
            <Grid key={escrow.id} item xs={12} sm={6} md={4}>
              <Escrow escrow={escrow} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
