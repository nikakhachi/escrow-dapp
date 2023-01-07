// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import './EscrowBase.sol';
import './EscrowAdmin.sol';

contract EscrowAgent is EscrowBase, EscrowAdmin {

    function initiateEscrow(address _seller, address _buyer, uint _depositAmount, string memory _description) external onlyAgent differentBuyerAndSeller(_seller, _buyer) {
        uint newEscrowId = escrows.length;
        Escrow memory escrow = Escrow(
                newEscrowId, 
                _seller, 
                _buyer, 
                _depositAmount, 
                EscrowStatus.PENDING, 
                agentFeePercentage,
                _description,
                block.timestamp,
                block.timestamp
            );
    
        escrows.push(escrow);
        emit EscrowInitiated(                
                newEscrowId, 
                _seller, 
                _buyer, 
                _depositAmount, 
                EscrowStatus.PENDING, 
                agentFeePercentage,
                _description,
                block.timestamp,
                block.timestamp);
    }

    function depositEscrow(uint _escrowId) external payable {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can deposit to Escrow");
        require(escrow.status == EscrowStatus.PENDING, "Deposit is only allowed on pending Escrow");
        require(msg.value == escrow.depositAmount, "Deposit must be equal to escrow's needed amount");
        escrow.status = EscrowStatus.DEPOSITED;
        escrow.updatedAt = block.timestamp;
        emit EscrowDeposited(_escrowId, block.timestamp);
    }

    function approveEscrow(uint _escrowId) external onlyAgent {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "You can only approve Escrow with deposited status");
        uint agentFee = escrow.depositAmount * escrow.agentFeePercentage / 100;
        (bool sent,) = escrow.seller.call{value: escrow.depositAmount - agentFee}("");
        require(sent, "Failed to send Ether");
        escrow.status = EscrowStatus.APPROVED;
        escrow.updatedAt = block.timestamp;
        withdrawableFunds += agentFee;
        emit EscrowApproved(_escrowId, block.timestamp);
    }

    function rejectEscrow(uint _escrowId) external onlyAgent {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "You can only reject Escrow with deposited status");
        (bool sent,) = escrow.buyer.call{ value: escrow.depositAmount }("");
        require(sent, "Failed to send Ether");
        escrow.status = EscrowStatus.REJECTED;
        escrow.updatedAt = block.timestamp;
        emit EscrowRejected(_escrowId, block.timestamp);
    }

    function archiveEscrow(uint _escrowId) external onlyAgent{
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.PENDING, "Can't archive active Escrow");
        escrow.status = EscrowStatus.ARCHIVED;
        escrow.updatedAt = block.timestamp;
        emit EscrowArchived(_escrowId, block.timestamp);
    }

    function getAllEscrows() external view returns (Escrow[] memory){
        return escrows;
    }

    function getEscrowById(uint _escrowId) external view returns (Escrow memory){
        return escrows[_escrowId];
    }
}
