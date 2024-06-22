import { useContext } from "react";
import { BallotsContext, BallotsContextType } from "../contexts/BallotsContext";

export const useBallotsContext = (): BallotsContextType => {
  const context = useContext(BallotsContext);
  if (!context) {
    throw new Error(
      "useBallotsContext must be used within a BallotsContextProvider"
    );
  }
  return context;
};
