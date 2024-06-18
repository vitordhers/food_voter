import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

interface ContractProviderProps {
  children: ReactNode;
}

interface ContractContextType {
  mainContractAddress: string;
}

const ContractContext = createContext<ContractContextType | undefined>(
  undefined
);

export const ContractProvider: FC<ContractProviderProps> = ({ children }) => {
  const [mainContractAddress] = useState("0xYOUR_CONTRACT_ADDRESS");

  const value = useMemo<ContractContextType>(
    () => ({ mainContractAddress }),
    [mainContractAddress]
  );

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
