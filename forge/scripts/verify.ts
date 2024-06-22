import { Wallet } from "ethers";
import Web3 from "web3";
import fs from "fs";
import * as dotenv from 'dotenv';
dotenv.config();

async function submitContractVerification() {
  const contractAddress = "0xcc11310ea44d3f753ba028326ac0dc8400627677";
  const contractName = "BallotsManager";
  const compilerVersion = "v0.8.24+commit.e11b9ed9";
  const optimization = "yes"; // or 'no' if not optimized
  const wallet = Wallet.fromPhrase(
    "twenty clay apart shed split grace river airport capital sample found permit"
  );
  const privateKey = wallet.privateKey;
  const rpcUrl = "https://rpc-amoy.polygon.technology";
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  // Load contract source code
  const contractSourceCode = fs.readFileSync(
    "../src/BallotsManager.sol",
    "utf8"
  );

  // Load contract ABI (should be already available if you deployed the contract)
  const contractABI = JSON.parse(
    fs.readFileSync("../out/BallotsManager.sol/BallotsManager.json", "utf8")
  );

  try {
    // Send verification request to Etherscan API
    const response = await web3.eth.accounts.signTransaction({
      to: contractAddress,
      data: contractSourceCode,
      name: contractName,
      compiler: compilerVersion,
      optimization: optimization,
      abi: contractABI,
    });

    console.log("Verification Request Submitted:", response);
  } catch (error) {
    console.error("Error submitting verification request:", error);
  }
}

// Call the function to submit the verification request
submitContractVerification();
