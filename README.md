## Food voter app

# Setup

1. Install [Foundry Suite](https://github.com/foundry-rs/foundry) and [NodeJs](https://nodejs.org/en/download/package-manager).

2. Change directory to ```forge`` directory and start local Anvil node (keep this terminal running);
```shell
$ cd forge;
$ anvil
```
Store any private key provided by Anvil.

# Running locally

1. In another terminal, but same folder, add a .env file according to `.env_template`, and set the stored `private key`.

2. In the same folder, in order to deploy `BallotsManager` contract via:

```shell
$ forge script TestDeployBallotsManagerScript --rpc-url http://127.0.0.1:8545  --broadcast;
```

Store deployed contract address.

3. Now, back to root directory, create a `.env.development` file following `.env_template` template, providing as an env var the address from contract deployed in step above.

4. Start a local instance of React by running `npm run local`. Don't forget to run `npm install` to install dependencies.

5. In app tab, connect to Local RPC Anvil node using Metamask, by clicking at Metamask icon, then click at the top left to chose network, and insert:

**Name**: Anvil local node
**New RPC URL**: http://127.0.0.1:8545
**Chain ID**: 31337
**Currency symbol**: GO

then save.

6. Connect to app and start creating ballots and casting votes.

# Testing

1. At `forge` directory, simply run 

```shell
$ forge test 
```

# Known Issues
 - Apparently when sending EOA requests to Anvil nodes, `msg.sender` is not recognized, that may display voting options. Even though that happens, contract prevents double voting.
 - Contracts compiled by `forge` don't seem to yield verifiable `bytecode` for contracts, preventing verification. 
