export type Escrow = {
  seller: string;
  buyer: string;
  id: number;
  depositAmountInEth: number;
  status: number;
  agentFeePercentage: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};
