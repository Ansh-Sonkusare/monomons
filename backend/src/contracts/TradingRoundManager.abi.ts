export const TradingRoundManagerABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createRound",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "bettingEndTime", "type": "uint256" },
      { "name": "roundEndTime", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "depositUserBet",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "agentId", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "lockBetting",
    "inputs": [{ "name": "roundId", "type": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recordAgentBet",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "agentId", "type": "uint8" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "settleRound",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "agentPnLs", "type": "int256[4]" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimWinnings",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "userAddress", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelRound",
    "inputs": [{ "name": "roundId", "type": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "refundUser",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "userAddress", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "calculateUserPayout",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "userAddress", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserBet",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "userAddress", "type": "address" },
      { "name": "agentId", "type": "uint8" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgentPool",
    "inputs": [
      { "name": "roundId", "type": "string" },
      { "name": "agentId", "type": "uint8" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRoundStatus",
    "inputs": [{ "name": "roundId", "type": "string" }],
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWinners",
    "inputs": [{ "name": "roundId", "type": "string" }],
    "outputs": [{ "name": "", "type": "uint8[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdrawPlatformFees",
    "inputs": [{ "name": "roundId", "type": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "admin",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "PLATFORM_CUT_PERCENT",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_BET",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "RoundCreated",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true },
      { "name": "bettingEndTime", "type": "uint256", "indexed": false },
      { "name": "roundEndTime", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "UserBetPlaced",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true },
      { "name": "user", "type": "address", "indexed": true },
      { "name": "agentId", "type": "uint8", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "BettingLocked",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "AgentTileBetRecorded",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true },
      { "name": "agentId", "type": "uint8", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "RoundSettled",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true },
      { "name": "winners", "type": "uint8[]", "indexed": false },
      { "name": "platformCut", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "WinningsClaimed",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true },
      { "name": "user", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "RoundCancelled",
    "inputs": [
      { "name": "roundId", "type": "string", "indexed": true },
      { "name": "reason", "type": "string", "indexed": false }
    ]
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  }
] as const;
