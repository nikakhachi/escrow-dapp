import { Grid, TextField, Divider, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { useContext, useState } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import ButtonText from "./ButtonText";

const AdminFunctions = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const [newAgent, setNewAgent] = useState("");
  const [newAgentPercentageFee, setNewAgentPercentageFee] = useState(0);

  return (
    <Grid container item xs={12} spacing={3}>
      <Grid item xs={12}>
        <Typography>
          <strong>Logged in as:</strong> {escrowAgentContext?.metamaskAccount.toLowerCase()}
        </Typography>
        <Divider sx={{ margin: "0.5rem 0" }} />
        <Typography>
          <strong>Current Agent:</strong> {escrowAgentContext?.currentAgent?.toLowerCase()}
        </Typography>
        <Typography>
          <strong>Current Agent Fee:</strong> {escrowAgentContext?.currentAgentFeePercentage}%
        </Typography>
        <Typography>
          <strong>Withdrawable Funds:</strong> {escrowAgentContext?.withdrawableFundsInETH} ETH
        </Typography>
      </Grid>
      <Grid container item xs={12} sm={6} spacing={1}>
        <Grid item xs={12}>
          <TextField
            disabled={escrowAgentContext?.isMining}
            value={newAgent}
            onChange={(e) => setNewAgent(e.target.value)}
            fullWidth
            size="small"
            label="Change the Agent"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            onClick={() => {
              if (!newAgent) return alert("Field is missing");
              escrowAgentContext?.changeAgent(newAgent);
            }}
            disabled={escrowAgentContext?.isMining}
            fullWidth
            color="primary"
            variant="contained"
            size="small"
          >
            <ButtonText text={"Change the Agent"} />
          </Button>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Grid container item xs={12} spacing={1}>
          <Grid item xs={12}>
            <TextField
              disabled={escrowAgentContext?.isMining}
              value={newAgentPercentageFee}
              onChange={(e) => setNewAgentPercentageFee(Number(e.target.value))}
              fullWidth
              size="small"
              type="number"
              label="Update the Agent Percentage Fee"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              onClick={() => {
                if (!newAgentPercentageFee) return alert("Field is missing");
                if (newAgentPercentageFee < 0 || newAgentPercentageFee >= 100) return alert("Number should be between 0 and 99");
                escrowAgentContext?.updateAgentPercentageFee(newAgentPercentageFee);
              }}
              disabled={escrowAgentContext?.isMining}
              fullWidth
              color="primary"
              variant="contained"
              size="small"
            >
              <ButtonText text={"Update the Agent Percentage Fee"} />
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button
          onClick={escrowAgentContext?.withdrawFunds}
          disabled={escrowAgentContext?.isMining}
          fullWidth
          color="primary"
          variant="contained"
          size="small"
        >
          <ButtonText text={"Withdraw Funds"} />
        </Button>
      </Grid>
    </Grid>
  );
};

export default AdminFunctions;
