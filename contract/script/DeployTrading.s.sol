// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TradingRoundManager.sol";

contract DeployTradingRoundManager is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        TradingRoundManager manager = new TradingRoundManager();
        
        vm.stopBroadcast();
        
        console.log("TradingRoundManager deployed at:", address(manager));
        console.log("Admin:", manager.admin());
        console.log("Platform cut:", manager.PLATFORM_CUT_PERCENT(), "%");
        console.log("Min bet:", manager.MIN_BET());
    }
}
