/* eslint-disable @typescript-eslint/no-explicit-any */
import { EIP1193Events } from "../types/eip-1193.type";

// Ethereum provider interface based on EIP-1193
export interface Ethereum {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: EIP1193Events, handler: (args: any) => void) => void;
  removeListener: (event: EIP1193Events, handler: (args: any) => void) => void;
}
