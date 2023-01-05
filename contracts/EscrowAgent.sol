// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract EscrowAgent {
    address public agent;
    uint8 public agentFeePercentage = 10;

    enum EscrowStatus{ PENDING, DEPOSITED, APPROVED, REJECTED, ARCHIVED }

	struct Escrow {
        uint id;
        address seller;
        address buyer;
        uint depositAmount;
        EscrowStatus status;
        uint8 agentFeePercentage;
    }

    Escrow[] public escrows;

    constructor(){
        agent = msg.sender;
    } 

    modifier onlyAgent {
        require(msg.sender == agent, "Only Agent can call this function");
        _;
    }

    modifier differentBuyerAndSeller(address _seller, address _buyer) {
        require(_seller != _buyer, "Buyer and Sellet should be Different");
        _;
    }

    function initiateEscrow(address _seller, address _buyer, uint _depositAmount) external onlyAgent differentBuyerAndSeller(_seller, _buyer) {
        uint newEscrowId = escrows.length;
        Escrow memory escrow = Escrow(
                newEscrowId, 
                _seller, 
                _buyer, 
                _depositAmount, 
                EscrowStatus.PENDING, 
                agentFeePercentage
            );
    
        escrows.push(escrow);
    }

    function depositEscrow(uint _escrowId) external payable {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can deposit to Escrow");
        require(escrow.status == EscrowStatus.PENDING, "Deposit is only allowed on pending Escrow");
        require(msg.value == escrow.depositAmount, "Deposit must be equal to escrow's needed amount");
        escrow.status = EscrowStatus.DEPOSITED;
    }

    function approveEscrow(uint _escrowId) external onlyAgent {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "You can only approve Escrow with deposited status");
        uint agentFee = escrow.depositAmount * agentFeePercentage / 100;
        (bool sent,) = escrow.seller.call{value: escrow.depositAmount - agentFee}("");
        require(sent, "Failed to send Ether");
        escrow.status = EscrowStatus.APPROVED;
    }

    function rejectEscrow(uint _escrowId) external onlyAgent {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "You can only reject Escrow with deposited status");
        (bool sent,) = escrow.buyer.call{value: escrow.depositAmount}("");
        require(sent, "Failed to send Ether");
        escrow.status = EscrowStatus.REJECTED;
    }

    function archiveEscrow(uint _escrowId) external onlyAgent{
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.PENDING, "Can't archive active Escrow");
        escrow.status = EscrowStatus.ARCHIVED;
    }

    function getAllEscrows() external view returns (Escrow[] memory){
        return escrows;
    }

    function changeAgentFeePercentage(uint8 _newFeePercentage) external onlyAgent {
        require(_newFeePercentage >= 0 && _newFeePercentage < 100, "Value should be non-decimal in range of 0 and 99");
        agentFeePercentage = _newFeePercentage;
    }
}