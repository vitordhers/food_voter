import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Contract } from "web3";
import BallotsManager from "../assets/abi/BallotsManager.json";
import Ballot from "../assets/abi/Ballot.json";
import { useWeb3Context } from "../hooks/useWeb3Context";
// import { BallotData } from "../interfaces/ballot-data.interface";
import { instantiateContract } from "../functions/instantiate-contract.function";

interface BallotsContextProviderProps {
  children: ReactNode;
}

interface Pagination {
  currentPageIndex?: number;
  maxPageIndex?: number;
}

export interface BallotsContextType {
  loadingBallotsAddresses: boolean;
  getBallotsManager: () => Contract<typeof BallotsManager.abi> | undefined;
  ballotsAddresses: string[];
  instantiateBallot: (
    address: string
  ) => Contract<typeof Ballot.abi> | undefined;
  setPagination: Dispatch<SetStateAction<Pagination>>;
  pagination: Pagination;
}

export const BallotsContext = createContext<BallotsContextType | undefined>(
  undefined
);

const PAGINATION_SIZE = 5;

export const BallotsContextProvider: FC<BallotsContextProviderProps> = ({
  children,
}) => {
  const { ballotsManagerRef, getWeb3Provider, selectedAccountAddress } =
    useWeb3Context();

  const [ballotsAddresses, setBallotsAddresses] = useState<string[]>([]);

  const [loadingBallotsAddresses, setLoadingBallotsAddresses] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPageIndex: undefined,
    maxPageIndex: undefined,
  });

  useEffect(() => {
    const contract = ballotsManagerRef?.current;
    if (!ballotsManagerRef || !contract || !selectedAccountAddress) return;

    const subscription = contract.events.NewBallot();

    subscription.on("data", async (data) => {
      const id = data.returnValues["id"] as string;

      try {
        const _contract = ballotsManagerRef?.current;
        if (!ballotsManagerRef || !_contract) return;

        const address = await _contract.methods
          .ballotIdAddressMap(id)
          .call<string>({ from: selectedAccountAddress });

        setBallotsAddresses((addresses) => [address, ...addresses]);
      } catch (error) {
        console.error("ballotIdAddressMap", { error });
      }
    });

    subscription.on("error", (error) =>
      console.log("subscription error", { error })
    );
    subscription.on("connected", (connected) => console.log({ connected }));
  }, [selectedAccountAddress, ballotsManagerRef]);

  useEffect(() => {
    const controller = new AbortController();

    const runPagination = async () => {
      const ballotsManager = ballotsManagerRef.current;
      const { currentPageIndex, maxPageIndex } = pagination;

      if (currentPageIndex === undefined || maxPageIndex === undefined) return;
      if (currentPageIndex > maxPageIndex) return;
      setLoadingBallotsAddresses(true);

      const startAt = currentPageIndex * PAGINATION_SIZE;

      try {
        const newAddresses = await ballotsManager.methods
          .paginateBallots(startAt)
          .call<string[]>({ from: selectedAccountAddress });

        setBallotsAddresses((addresses) => [...addresses, ...newAddresses]);
      } catch (error) {
        console.error("paginateBallots", { error });
      } finally {
        setLoadingBallotsAddresses(false);
      }
    };

    runPagination();

    return () => {
      controller.abort();
    };
  }, [selectedAccountAddress, pagination, ballotsManagerRef]);

  // initial pagination
  useEffect(() => {
    const controller = new AbortController();

    const fetchBallotsLength = async () => {
      const ballotsManager = ballotsManagerRef.current;
      if (!ballotsManager) return;
      try {
        if (controller.signal.aborted) return;
        setLoadingBallotsAddresses(true);
        const totalBallotsBN = await ballotsManager.methods
          .currentBallotIdArrayLikeLength()
          .call<bigint>({ from: selectedAccountAddress });

        const totalBallots = Number(totalBallotsBN);
        if (!totalBallots) return;
        let maxPageIndex =
          totalBallots < PAGINATION_SIZE
            ? 0
            : totalBallots % PAGINATION_SIZE === 0
            ? totalBallots / PAGINATION_SIZE - 1
            : totalBallots / PAGINATION_SIZE;
        if (maxPageIndex < 0) {
          maxPageIndex = 0;
        }
        if (controller.signal.aborted) return;
        setPagination({ currentPageIndex: 0, maxPageIndex });
      } catch (error) {
        console.error("currentBallotIdArrayLikeLength error", { error });
      } finally {
        setLoadingBallotsAddresses(false);
      }
    };

    fetchBallotsLength();

    return () => {
      controller.abort();
    };
  }, [selectedAccountAddress, ballotsManagerRef]);

  const getBallotsManager = useCallback(
    () => ballotsManagerRef.current,
    [ballotsManagerRef]
  );

  const instantiateBallot = useCallback(
    (address: string) => {
      const web3 = getWeb3Provider();

      if (!web3) return;

      return instantiateContract(web3, Ballot.abi, address);
    },
    [getWeb3Provider]
  );

  const value = useMemo(
    () => ({
      instantiateBallot,
      loadingBallotsAddresses,
      getBallotsManager,
      ballotsAddresses,
      setPagination,
      pagination,
    }),
    [
      instantiateBallot,
      loadingBallotsAddresses,
      getBallotsManager,
      ballotsAddresses,
      setPagination,
      pagination,
    ]
  );
  return (
    <BallotsContext.Provider value={value}>{children}</BallotsContext.Provider>
  );
};
