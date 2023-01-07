import { Grid, TextField, CircularProgress } from "@mui/material";
import Button from "@mui/material/Button";
import { useContext, useState } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import { SnackbarContext } from "../contexts/SnackbarContext";
import ButtonText from "./ButtonText";

const AddEscrowForm = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);
  const snackbarContext = useContext(SnackbarContext);

  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [depositAmountInEth, setDepositAmountInEth] = useState(0);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!buyer || !seller || !depositAmountInEth) return snackbarContext?.open("Fields are missing!", "error");
    escrowAgentContext?.initiateEscrow(seller, buyer, depositAmountInEth, description);
  };

  return (
    <Grid container item xs={12} spacing={1}>
      <Grid item xs={12} sm={5}>
        <TextField
          disabled={escrowAgentContext?.isMining}
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          fullWidth
          size="small"
          label="Seller"
        />
      </Grid>
      <Grid item xs={12} sm={5}>
        <TextField
          disabled={escrowAgentContext?.isMining}
          value={buyer}
          onChange={(e) => setBuyer(e.target.value)}
          fullWidth
          size="small"
          label="Buyer"
        />
      </Grid>
      <Grid item xs={12} sm={2}>
        <TextField
          value={depositAmountInEth}
          onChange={(e) => setDepositAmountInEth(Number(e.target.value))}
          fullWidth
          type="number"
          size="small"
          label="ETH Deposit"
          disabled={escrowAgentContext?.isMining}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          disabled={escrowAgentContext?.isMining}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          size="small"
          label="Description"
        />
      </Grid>
      <Grid item xs={12}>
        <Button disabled={escrowAgentContext?.isMining} onClick={handleSubmit} fullWidth color="primary" variant="contained" size="small">
          <ButtonText text={"Initiate Escrow"} />
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddEscrowForm;
