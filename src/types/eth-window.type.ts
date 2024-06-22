import { Ethereum } from "../interfaces/ethereum.interface";

export type EthWindow = Window &
  typeof globalThis & { ethereum?: Ethereum };
