// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract EscrowBase {
    event EscrowInitiated(
        uint id, 
        address seller, 
        address buyer, 
        uint depositAmount, 
        EscrowStatus status, 
        uint8 agentFeePercentage, 
        string description, 
        uint createdAt, 
        uint updatedAt
    );
    event EscrowDeposited(uint id, uint timestamp);
    event EscrowApproved(uint id, uint timestamp);
    event EscrowRejected(uint id, uint timestamp);
    event EscrowArchived(uint id, uint timestamp);
    event AgentChanged(address newAgent);
    event AgentFeePercentageUpdated(uint8 newAgentFeePercentage);
    event FundsWithdrawn(uint amount);

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
}
