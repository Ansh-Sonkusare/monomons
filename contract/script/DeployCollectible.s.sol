// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/MonomonsCollectible.sol";

contract DeployMonomonsCollectible is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MonomonsCollectible collectible = new MonomonsCollectible();
        
        vm.stopBroadcast();
        
        console.log("MonomonsCollectible deployed at:", address(collectible));
        console.log("Admin:", collectible.owner());
    }
}
