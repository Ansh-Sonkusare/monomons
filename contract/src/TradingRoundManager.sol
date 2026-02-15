// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TradingRoundManager {
    enum RoundStatus { BETTING, TRADING, SETTLED, CANCELLED }

    struct Round {
        string roundId;
        RoundStatus status;
        uint256 bettingEndTime;
        uint256 roundEndTime;
        uint256[4] agentPools;
        mapping(address => mapping(uint8 => uint256)) userBets;
        mapping(uint8 => uint256) agentFinalPnL;
        uint8[] winners;
        uint256 totalPool;
        uint256 platformCut;
        mapping(address => bool) payoutsClaimed;
    }

    address public admin;
    mapping(string => Round) public rounds;
    uint256 public constant PLATFORM_CUT_PERCENT = 5;
    uint256 public constant MIN_BET = 0.1 ether;

    // Events
    event RoundCreated(string indexed roundId, uint256 bettingEndTime, uint256 roundEndTime);
    event UserBetPlaced(string indexed roundId, address indexed user, uint8 agentId, uint256 amount, uint256 timestamp);
    event BettingLocked(string indexed roundId);
    event AgentTileBetRecorded(string indexed roundId, uint8 agentId, uint256 amount);
    event RoundSettled(string indexed roundId, uint8[] winners, uint256 platformCut);
    event WinningsClaimed(string indexed roundId, address indexed user, uint256 amount);
    event RoundCancelled(string indexed roundId, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createRound(
        string memory roundId,
        uint256 bettingEndTime,
        uint256 roundEndTime
    ) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(bytes(round.roundId).length == 0, "Round already exists");
        require(bettingEndTime > block.timestamp, "Invalid betting end time");
        require(roundEndTime > bettingEndTime, "Invalid round end time");

        round.roundId = roundId;
        round.status = RoundStatus.BETTING;
        round.bettingEndTime = bettingEndTime;
        round.roundEndTime = roundEndTime;

        emit RoundCreated(roundId, bettingEndTime, roundEndTime);
    }

    function depositUserBet(string memory roundId, uint8 agentId) external payable {
        Round storage round = rounds[roundId];
        require(bytes(round.roundId).length > 0, "Round does not exist");
        require(round.status == RoundStatus.BETTING, "Betting not active");
        require(block.timestamp < round.bettingEndTime, "Betting period ended");
        require(msg.value >= MIN_BET, "Bet too small");
        require(agentId < 4, "Invalid agent ID");

        round.userBets[msg.sender][agentId] += msg.value;
        round.agentPools[agentId] += msg.value;
        round.totalPool += msg.value;

        emit UserBetPlaced(roundId, msg.sender, agentId, msg.value, block.timestamp);
    }

    function lockBetting(string memory roundId) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.BETTING, "Not in betting phase");
        
        round.status = RoundStatus.TRADING;
        emit BettingLocked(roundId);
    }

    function recordAgentBet(
        string memory roundId,
        uint8 agentId,
        uint256 amount
    ) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.TRADING, "Not in trading phase");
        require(agentId < 4, "Invalid agent ID");

        emit AgentTileBetRecorded(roundId, agentId, amount);
    }

    function settleRound(
        string memory roundId,
        int256[4] memory agentPnLs
    ) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.TRADING, "Not in trading phase");

        // Find max PnL
        int256 maxPnL = agentPnLs[0];
        for (uint8 i = 1; i < 4; i++) {
            if (agentPnLs[i] > maxPnL) {
                maxPnL = agentPnLs[i];
            }
        }

        // Find all winners (handles ties)
        delete round.winners;
        for (uint8 i = 0; i < 4; i++) {
            if (agentPnLs[i] == maxPnL) {
                round.winners.push(i);
            }
        }

        // Calculate platform cut
        round.platformCut = (round.totalPool * PLATFORM_CUT_PERCENT) / 100;
        round.status = RoundStatus.SETTLED;

        emit RoundSettled(roundId, round.winners, round.platformCut);
    }

    function claimWinnings(string memory roundId, address userAddress) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.SETTLED, "Round not settled");
        require(!round.payoutsClaimed[userAddress], "Already claimed");

        uint256 payout = calculateUserPayout(roundId, userAddress);
        require(payout > 0, "No winnings");

        round.payoutsClaimed[userAddress] = true;
        
        (bool success, ) = userAddress.call{value: payout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(roundId, userAddress, payout);
    }

    function calculateUserPayout(
        string memory roundId,
        address userAddress
    ) public view returns (uint256) {
        Round storage round = rounds[roundId];
        if (round.winners.length == 0) return 0;

        uint256 prizePool = round.totalPool - round.platformCut;
        uint256 totalWinningBets = 0;
        uint256 userWinningBets = 0;

        // Sum all winning bets
        for (uint8 i = 0; i < round.winners.length; i++) {
            uint8 winnerId = round.winners[i];
            totalWinningBets += round.agentPools[winnerId];
            userWinningBets += round.userBets[userAddress][winnerId];
        }

        if (totalWinningBets == 0 || userWinningBets == 0) return 0;

        return (prizePool * userWinningBets) / totalWinningBets;
    }

    function cancelRound(string memory roundId) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status != RoundStatus.SETTLED, "Already settled");
        require(round.status != RoundStatus.CANCELLED, "Already cancelled");

        round.status = RoundStatus.CANCELLED;
        emit RoundCancelled(roundId, "Admin cancelled");
    }

    function refundUser(string memory roundId, address userAddress) external {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.CANCELLED, "Not cancelled");
        require(!round.payoutsClaimed[userAddress], "Already refunded");

        uint256 totalRefund = 0;
        for (uint8 i = 0; i < 4; i++) {
            totalRefund += round.userBets[userAddress][i];
        }

        require(totalRefund > 0, "No bets to refund");
        round.payoutsClaimed[userAddress] = true;

        (bool success, ) = userAddress.call{value: totalRefund}("");
        require(success, "Refund failed");
    }

    function getUserBet(
        string memory roundId,
        address userAddress,
        uint8 agentId
    ) external view returns (uint256) {
        return rounds[roundId].userBets[userAddress][agentId];
    }

    function getAgentPool(string memory roundId, uint8 agentId) external view returns (uint256) {
        return rounds[roundId].agentPools[agentId];
    }

    function getRoundStatus(string memory roundId) external view returns (RoundStatus) {
        return rounds[roundId].status;
    }

    function getWinners(string memory roundId) external view returns (uint8[] memory) {
        return rounds[roundId].winners;
    }

    function withdrawPlatformFees(string memory roundId) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.SETTLED, "Not settled");
        
        uint256 fees = round.platformCut;
        round.platformCut = 0;

        (bool success, ) = admin.call{value: fees}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {}
}
