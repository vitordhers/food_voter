import { Ethereum } from "../interfaces/ethereum.interface";

export type PhantomWindow = Window &
  typeof globalThis & { phantom?: { ethereum: Ethereum } };
