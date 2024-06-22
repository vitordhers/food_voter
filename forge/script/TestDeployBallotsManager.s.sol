// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BallotsManager} from "../src/BallotsManager.sol";

contract TestDeployBallotsManagerScript is Script {
    function run() public  {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        new BallotsManager();
        vm.stopBroadcast();
    }
}
