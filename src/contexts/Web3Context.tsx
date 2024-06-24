import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Web3ConnectionStatus } from "../enum/web3-connection-status.enum";
import {
  Contract,
  HttpProvider,
  ProviderConnectInfo,
  Web3,
  Web3Eip1193ProviderEventCallback,
} from "web3";
import { EthWindow } from "../types/eth-window.type";
import BallotsManager from "../assets/abi/BallotsManager.json";
import { instantiateContract } from "../functions/instantiate-contract.function";
import { RegisteredSubscription } from "web3-eth";

const LOCAL_STORAGE_PERMISSION_KEY = "food-voter-app-permission";
interface Web3ContextProviderProps {
  children: ReactNode;
}

export interface Web3ContextType {
  selectedAccountAddress?: string;
  walletAccounts: string[];
  web3Status: Web3ConnectionStatus;
  connectToMetaMask: () => Promise<void>;
  selectAddressByIndex: (i: number) => void;
  web3: Web3<RegisteredSubscription>;
  ballotsManager: Contract<typeof BallotsManager.abi>;
}

export const Web3Context = createContext<Web3ContextType | undefined>(
  undefined
);

export const Web3ContextProvider: FC<Web3ContextProviderProps> = ({
  children,
}) => {
  const [web3, setWeb3] = useState<Web3>(
    new Web3(new HttpProvider(import.meta.env.VITE_PROVIDER_RPC))
  );
  const [ballotsManager, setBallotsManager] = useState(
    instantiateContract(
      web3,
      BallotsManager.abi,
      import.meta.env.VITE_BALLOTS_MANAGER_ADDR
    )
  );

  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

  const [selectedAccountAddress, setSelectedAccountAddress] = useState<
    string | undefined
  >();

  const [walletAccounts, setWalletAccounts] = useState<string[]>([]);

  const [web3Status, setWeb3Status] = useState<Web3ConnectionStatus>(
    Web3ConnectionStatus.None
  );

  const fireInstallMetaMaskWarn = useCallback(() => {
    if (!window || !location) return;
    alert("Install Metamask in order to use this app!");

    window.open(
      "https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en",
      "_blank"
    );

    location.reload();
  }, []);

  useEffect(() => {
    if (!web3 || !isMetaMaskConnected) return;
    const provider = web3.provider;
    if (!provider) return;

    const accountsChangedCb: Web3Eip1193ProviderEventCallback<string[]> = (
      accounts: string[]
    ) => {
      setSelectedAccountAddress(accounts[0]);
    };

    const connectCb: Web3Eip1193ProviderEventCallback<ProviderConnectInfo> = (
      chainId
    ) => {
      console.log("connect cb", chainId);
    };

    const chainChangedCb: Web3Eip1193ProviderEventCallback<string> = (
      chainId
    ) => {
      console.log("connect cb", chainId);
    };

    provider.on("accountsChanged", accountsChangedCb);
    provider.on("connect", connectCb);
    provider.on("chainChanged", chainChangedCb);

    return () => {
      provider.removeListener("accountsChanged", accountsChangedCb);
      provider.removeListener("connect", connectCb);
      provider.removeListener("chainChanged", chainChangedCb);
    };
  }, [web3, isMetaMaskConnected]);

  const connectToMetaMask = useCallback(async () => {
    const eth = (window as EthWindow).ethereum;
    if (!eth) {
      fireInstallMetaMaskWarn();
      return;
    }

    try {
      setWeb3Status(Web3ConnectionStatus.Connecting);
      await eth.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(eth);
      setWeb3(web3);
      setIsMetaMaskConnected(true);
      const ballotsManager = instantiateContract(
        web3,
        BallotsManager.abi,
        import.meta.env.VITE_BALLOTS_MANAGER_ADDR
      );

      const accounts = await web3.eth.getAccounts();
      setWalletAccounts(accounts);
      setBallotsManager(ballotsManager);
      // sets to default account, falls back to first available account, if any
      setSelectedAccountAddress(web3.eth.defaultAccount || accounts[0]);

      localStorage.setItem(
        LOCAL_STORAGE_PERMISSION_KEY,
        String(Web3ConnectionStatus.Accepted)
      );

      setWeb3Status(Web3ConnectionStatus.Accepted);
    } catch (error) {
      setIsMetaMaskConnected(false);
      if (error instanceof Error && "code" in error) {
        if (error.code === -32002) {
          return;
        }
        if (error.code === 4001) {
          // TODO: fire in order to continue must connect to metamask
          setWeb3Status(Web3ConnectionStatus.Rejected);
          localStorage.setItem(
            LOCAL_STORAGE_PERMISSION_KEY,
            String(Web3ConnectionStatus.Rejected)
          );
          return;
        }
        setWeb3Status(Web3ConnectionStatus.None);
      }
      setWeb3Status(Web3ConnectionStatus.None);
      localStorage.setItem(
        LOCAL_STORAGE_PERMISSION_KEY,
        String(Web3ConnectionStatus.None)
      );
      console.error("Failed to load web3 or accounts", error);
    }
  }, [fireInstallMetaMaskWarn]);

  useEffect(() => {
    if (web3Status !== Web3ConnectionStatus.None) return;

    const currentStatusStored: Web3ConnectionStatus = Number(
      localStorage.getItem(LOCAL_STORAGE_PERMISSION_KEY)
    );

    if (currentStatusStored !== Web3ConnectionStatus.Accepted) return;
    connectToMetaMask();
  }, [web3Status, connectToMetaMask]);

  const selectAddressByIndex = useCallback(
    (i: number) => {
      const selected = walletAccounts[i];
      setSelectedAccountAddress(selected);
    },
    [walletAccounts]
  );

  const value = useMemo<Web3ContextType>(
    () => ({
      ballotsManager,
      connectToMetaMask,
      selectedAccountAddress,
      selectAddressByIndex,
      walletAccounts,
      web3,
      web3Status,
    }),
    [
      ballotsManager,
      connectToMetaMask,
      selectedAccountAddress,
      selectAddressByIndex,
      walletAccounts,
      web3,
      web3Status,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
