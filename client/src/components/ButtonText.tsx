import React, { useContext } from "react";
import { CircularProgress } from "@mui/material";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

interface IProps {
  text: string;
}

const ButtonText: React.FC<IProps> = ({ text }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return escrowAgentContext?.isMining ? (
    <>
      <CircularProgress sx={{ marginRight: "5px" }} color="info" size="1rem" /> Mining ⛏️
    </>
  ) : (
    <span>{text}</span>
  );
};

export default ButtonText;
