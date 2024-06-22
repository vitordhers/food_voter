// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BallotsManager} from "../src/BallotsManager.sol";

contract Deploy is Script {
    function run() public {
         vm.txGasPrice(2);
        vm.startBroadcast();
        new BallotsManager();
        vm.stopBroadcast();
    }
}
