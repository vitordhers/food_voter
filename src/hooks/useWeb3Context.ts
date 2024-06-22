import { useContext } from "react";
import { Web3Context, Web3ContextType } from "../contexts/Web3Context";

export const useWeb3Context = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3Context must be used within a Web3ContextProvider");
  }
  return context;
};
