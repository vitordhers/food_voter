import { useContext } from "react";
import { UiContext, UiContextType } from "../contexts/UiContext";

export const useUiContext = (): UiContextType => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error("useUiContext must be used within a UiContextProvider");
  }
  return context;
};
