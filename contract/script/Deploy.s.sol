// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/GameVault.sol";

contract DeployGameVault is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        GameVault vault = new GameVault();
        
        vm.stopBroadcast();
        
        console.log("GameVault deployed at:", address(vault));
        console.log("Admin:", vault.admin());
    }
}
