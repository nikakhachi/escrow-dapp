// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "hardhat/console.sol";

contract EscrowAgent {
    address public agent;
    uint8 public agentFeePercentage = 10;
    uint public withdrawableFunds;

    enum EscrowStatus{ PENDING, DEPOSITED, APPROVED, REJECTED, ARCHIVED }

	struct Escrow {
        uint id;
        address seller;
        address buyer;
        uint depositAmount;
        EscrowStatus status;
        uint8 agentFeePercentage;
        string description;
        uint createdAt;
        uint updatedAt;
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
        require(_seller != _buyer, "Buyer and Seller should be Different");
        _;
    }

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
    }

    function depositEscrow(uint _escrowId) external payable {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can deposit to Escrow");
        require(escrow.status == EscrowStatus.PENDING, "Deposit is only allowed on pending Escrow");
        require(msg.value == escrow.depositAmount, "Deposit must be equal to escrow's needed amount");
        escrow.status = EscrowStatus.DEPOSITED;
        escrow.updatedAt = block.timestamp;
    }

    function approveEscrow(uint _escrowId) external onlyAgent {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "You can only approve Escrow with deposited status");
        uint agentFee = escrow.depositAmount * agentFeePercentage / 100;
        (bool sent,) = escrow.seller.call{value: escrow.depositAmount - agentFee}("");
        require(sent, "Failed to send Ether");
        escrow.status = EscrowStatus.APPROVED;
        escrow.updatedAt = block.timestamp;
        withdrawableFunds += agentFee;
    }

    function rejectEscrow(uint _escrowId) external onlyAgent {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "You can only reject Escrow with deposited status");
        (bool sent,) = escrow.buyer.call{ value: escrow.depositAmount }("");
        require(sent, "Failed to send Ether");
        escrow.status = EscrowStatus.REJECTED;
        escrow.updatedAt = block.timestamp;
    }

    function archiveEscrow(uint _escrowId) external onlyAgent{
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.PENDING, "Can't archive active Escrow");
        escrow.status = EscrowStatus.ARCHIVED;
        escrow.updatedAt = block.timestamp;
    }

    function getAllEscrows() external view returns (Escrow[] memory){
        return escrows;
    }

    function getEscrowById(uint _escrowId) external view returns (Escrow memory){
        return escrows[_escrowId];
    }

    function changeAgentFeePercentage(uint8 _newFeePercentage) external onlyAgent {
        require(_newFeePercentage >= 0 && _newFeePercentage < 100, "Value should be non-decimal in range of 0 and 99");
        agentFeePercentage = _newFeePercentage;
    }

    function withdrawFunds() external onlyAgent {
        (bool sent,) = agent.call{value: withdrawableFunds}("");
        require(sent, "Failed to send Ether");    
        withdrawableFunds = 0;
    }

    function changeAgent(address _newAgent) external onlyAgent {
        agent = _newAgent;
    }
}
