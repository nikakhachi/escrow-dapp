import Raect, { useContext } from "react";
import { Tooltip } from "@mui/material";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import moment from "moment";
import { EscrowStatus } from "../types/enums";
import { shortenAddress } from "../utils";
import { EscrowType } from "../types";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import ButtonText from "./ButtonText";

interface IProps {
  escrow: EscrowType;
}

const Escrow: React.FC<IProps> = ({ escrow }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const statusColor = (status: EscrowStatus) => {
    if (status === EscrowStatus.ARCHIVED) return "red";
    if (status === EscrowStatus.APPROVED) return "green";
    if (status === EscrowStatus.PENDING) return "blue";
    if (status === EscrowStatus.REJECTED) return "red";
  };

  return (
    <Card>
      <CardContent>
        <Tooltip title={escrow.seller}>
          <Typography variant="body2" color="text.secondary">
            <strong>Seller:</strong> {shortenAddress(escrow.seller)}
          </Typography>
        </Tooltip>
        <Tooltip title={escrow.buyer}>
          <Typography variant="body2" color="text.secondary">
            <strong>Buyer:</strong> {shortenAddress(escrow.buyer)}
          </Typography>
        </Tooltip>
        <Typography variant="body2" color="text.secondary">
          <strong>Amount in ETH:</strong> {escrow.depositAmountInEth}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Agent fee percentage:</strong> {escrow.agentFeePercentage}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Description:</strong> {escrow.description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Created At: </strong>
          {moment(escrow.createdAt).format("DD/MM/YYYY h:mma")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Updated At:</strong> {moment(escrow.updatedAt).format("DD/MM/YYYY h:mma")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Status:</strong> <span style={{ color: statusColor(escrow.status), fontWeight: 800 }}>{EscrowStatus[escrow.status]}</span>
        </Typography>
      </CardContent>
      <CardActions>
        {escrow.status === EscrowStatus.PENDING ? (
          <>
            <Button
              onClick={() => escrowAgentContext?.depositEscrow(escrow.id, escrow.depositAmountInEth)}
              disabled={escrowAgentContext?.isMining}
              color="primary"
              variant="contained"
              size="small"
            >
              <ButtonText text="Deposit" />
            </Button>
            <Button
              onClick={() => escrowAgentContext?.archiveEscrow(escrow.id)}
              disabled={escrowAgentContext?.isMining}
              color="error"
              variant="contained"
              size="small"
            >
              <ButtonText text="Archive" />
            </Button>
          </>
        ) : escrow.status === EscrowStatus.DEPOSITED ? (
          <>
            <Button
              onClick={() => escrowAgentContext?.approveEscrow(escrow.id)}
              disabled={escrowAgentContext?.isMining}
              color="primary"
              variant="contained"
              size="small"
            >
              <ButtonText text="Approve" />
            </Button>
            <Button
              onClick={() => escrowAgentContext?.rejectEscrow(escrow.id)}
              disabled={escrowAgentContext?.isMining}
              color="error"
              variant="contained"
              size="small"
            >
              <ButtonText text="Reject" />
            </Button>
          </>
        ) : null}
      </CardActions>
    </Card>
  );
};

export default Escrow;
