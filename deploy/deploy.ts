import { Wallet } from "ethers";
import { Web3, } from "web3";
import BallotsManager from "../forge/out/BallotsManager.sol/BallotsManager.json";
import * as dotenv from "dotenv";

const deploy = async () => {
  dotenv.config();
  const wallet = Wallet.fromPhrase(process.env.PASSPHRASE);
  const privateKey = wallet.privateKey;
  const rpcUrl = process.env.PROVIDER_RPC;

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const account = web3.eth.accounts.privateKeyToAccount(privateKey);

  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  const { abi, bytecode } = BallotsManager;

  try {
    const contract = new web3.eth.Contract(abi);

    const deployOptions = {
      data: bytecode.object,
      arguments: [],
    };

    const gasEstimate = await web3.eth.estimateGas(deployOptions);
    const gasPrice = await web3.eth.getGasPrice();

    const transaction = contract.deploy(deployOptions);

    const options = {
      data: transaction.encodeABI(),
      gas: gasEstimate,
      gasPrice,
      from: account.address,
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(
      options,
      privateKey
    );
    const receipt = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction
    );

    console.log("Contract deployed at address:", receipt.contractAddress);
  } catch (error) {
    console.error("Deployment failed:", error);
  }
};

deploy();
