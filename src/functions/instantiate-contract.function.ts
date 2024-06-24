import Web3, { Address, ContractAbi, ContractInitOptions } from "web3";
import { RegisteredSubscription } from "web3-eth";

export const instantiateContract = <Abi extends ContractAbi>(
  web3: Web3<RegisteredSubscription>,
  abi: Abi,
  address: Address
) => {
  const options: ContractInitOptions = { syncWithContext: true };
  return new web3.eth.Contract(abi, address, options);
};
