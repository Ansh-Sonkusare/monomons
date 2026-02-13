// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GameVault
 * @dev Contract for managing betting pools per game
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
 * 2. Run: forge init (if not already initialized)
 * 3. Copy this contract to src/GameVault.sol
 * 4. Create .env file with:
 *    - PRIVATE_KEY=your_private_key
 *    - RPC_URL=https://testnet-rpc.monad.xyz
 * 5. Run deployment script below
 */

contract GameVault {
    address public admin;
    
    // Game-based pools: gameId => total pool amount
    mapping(string => uint256) public gamePools;
    // Track which games are active
    mapping(string => bool) public activeGames;
    // Track user deposits per game: gameId => user => amount
    mapping(string => mapping(address => uint256)) public userGameDeposits;
    
    uint256 public totalDeposits;

    event Deposited(string indexed gameId, address indexed user, uint256 amount);
    event Withdrawn(string indexed gameId, uint256 amount, address indexed recipient);
    event GameEnded(string indexed gameId, uint256 remainingToAdmin);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Users deposit MON into a specific game pool
     * @param gameId Unique identifier for the game/room
     */
    function deposit(string calldata gameId) external payable {
        require(msg.value > 0, "Cannot deposit 0");
        require(bytes(gameId).length > 0, "Invalid game ID");
        
        gamePools[gameId] += msg.value;
        userGameDeposits[gameId][msg.sender] += msg.value;
        totalDeposits += msg.value;
        activeGames[gameId] = true;
        
        emit Deposited(gameId, msg.sender, msg.value);
    }

    /**
     * @dev Admin withdraws funds from a game pool to pay winners
     * @param gameId The game to withdraw from
     * @param amount Amount to withdraw in wei
     * @param recipient Address to send funds to
     */
    function withdrawFromGame(string calldata gameId, uint256 amount, address payable recipient) external onlyAdmin {
        require(activeGames[gameId], "Game not active");
        require(amount > 0, "Cannot withdraw 0");
        require(gamePools[gameId] >= amount, "Insufficient game balance");
        require(recipient != address(0), "Invalid recipient address");
        
        gamePools[gameId] -= amount;
        totalDeposits -= amount;
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer to recipient failed");
        
        emit Withdrawn(gameId, amount, recipient);
    }

    /**
     * @dev Ends a game and sends any remaining funds to admin
     * @param gameId The game to end
     */
    function endGame(string calldata gameId) external onlyAdmin {
        require(activeGames[gameId], "Game not active or already ended");
        
        uint256 remaining = gamePools[gameId];
        
        if (remaining > 0) {
            gamePools[gameId] = 0;
            totalDeposits -= remaining;
            (bool success, ) = payable(admin).call{value: remaining}("");
            require(success, "Transfer to admin failed");
        }
        
        activeGames[gameId] = false;
        
        emit GameEnded(gameId, remaining);
    }

    /**
     * @dev Change the admin address
     * @param newAdmin Address of the new admin
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminChanged(oldAdmin, newAdmin);
    }

    /**
     * @dev Get the balance of a specific game pool
     * @param gameId The game ID
     * @return The pool balance in wei
     */
    function getGameBalance(string calldata gameId) external view returns (uint256) {
        return gamePools[gameId];
    }

    /**
     * @dev Get a user's deposit amount for a specific game
     * @param gameId The game ID
     * @param user The user's address
     * @return The user's deposit amount in wei
     */
    function getUserGameDeposit(string calldata gameId, address user) external view returns (uint256) {
        return userGameDeposits[gameId][user];
    }

    /**
     * @dev Get the total deposits across all games
     * @return Total deposits in wei
     */
    function getTotalDeposits() external view returns (uint256) {
        return totalDeposits;
    }

    /**
     * @dev Check if a game is still active
     * @param gameId The game ID
     * @return True if game is active
     */
    function isGameActive(string calldata gameId) external view returns (bool) {
        return activeGames[gameId];
    }
}
