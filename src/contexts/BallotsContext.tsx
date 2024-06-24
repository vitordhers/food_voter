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
import Ballot from "../assets/abi/Ballot.json";
import { useWeb3Context } from "../hooks/useWeb3Context";
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
  const { ballotsManager, selectedAccountAddress, web3 } = useWeb3Context();

  const [ballotsAddresses, setBallotsAddresses] = useState<string[]>([]);

  const [loadingBallotsAddresses, setLoadingBallotsAddresses] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPageIndex: undefined,
    maxPageIndex: undefined,
  });

  useEffect(() => {
    if (!ballotsManager || !selectedAccountAddress) return;

    const subscription = ballotsManager.events.NewBallot();

    subscription.on("data", async (data) => {
      const id = data.returnValues["id"] as string;

      try {
        const address = await ballotsManager.methods
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
  }, [selectedAccountAddress, ballotsManager]);

  useEffect(() => {
    const controller = new AbortController();

    if (!ballotsManager || !selectedAccountAddress) return;

    const runPagination = async () => {
      const { currentPageIndex, maxPageIndex } = pagination;

      if (
        currentPageIndex === undefined ||
        maxPageIndex === undefined ||
        !selectedAccountAddress
      )
        return;
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
  }, [selectedAccountAddress, pagination, ballotsManager]);

  // initial pagination
  useEffect(() => {
    const controller = new AbortController();
    if (!ballotsManager || !selectedAccountAddress) return;

    const fetchBallotsLength = async () => {
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
  }, [selectedAccountAddress, ballotsManager]);

  const instantiateBallot = useCallback(
    (address: string) => {
      return instantiateContract(web3, Ballot.abi, address);
    },
    [web3]
  );

  const value = useMemo(
    () => ({
      instantiateBallot,
      loadingBallotsAddresses,
      ballotsAddresses,
      setPagination,
      pagination,
    }),
    [
      instantiateBallot,
      loadingBallotsAddresses,
      ballotsAddresses,
      setPagination,
      pagination,
    ]
  );
  return (
    <BallotsContext.Provider value={value}>{children}</BallotsContext.Provider>
  );
};
