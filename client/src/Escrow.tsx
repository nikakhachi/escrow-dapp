import { ethers } from "ethers";
import React from "react";

export interface EscrowProps {
  address: string;
  arbiter: string;
  beneficiary: string;
  value: number | string;
  approve: () => void;
}

const Escrow: React.FC<EscrowProps> = ({ address, arbiter, beneficiary, value, approve }) => {
  return (
    <div className="existing-contract">
      <ul className="fields">
        <li>
          <div> Arbiter </div>
          <div> {arbiter} </div>
        </li>
        <li>
          <div> Beneficiary </div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value </div>
          <div> {value} </div>
        </li>
        <div
          className="button"
          id={address}
          onClick={(e) => {
            e.preventDefault();
            approve();
          }}
        >
          Approve
        </div>
      </ul>
    </div>
  );
};

export default Escrow;
