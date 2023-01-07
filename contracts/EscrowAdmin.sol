// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import './EscrowBase.sol';

contract EscrowAdmin is EscrowBase {
    function changeAgentFeePercentage(uint8 _newFeePercentage) external onlyAgent {
        require(_newFeePercentage >= 0 && _newFeePercentage < 100, "Value should be non-decimal in range of 0 and 99");
        agentFeePercentage = _newFeePercentage;
        emit AgentFeePercentageUpdated(_newFeePercentage);
    }

    function withdrawFunds() external onlyAgent {
        (bool sent,) = agent.call{value: withdrawableFunds}("");
        require(sent, "Failed to send Ether");    
        withdrawableFunds = 0;
        emit FundsWithdrawn(withdrawableFunds);
    }

    function changeAgent(address _newAgent) external onlyAgent {
        agent = _newAgent;
        emit AgentChanged(_newAgent);
    }
}
