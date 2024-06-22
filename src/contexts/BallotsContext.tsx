import {
  FC,
  ReactNode,
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

export interface BallotsContextType {
  loadingBallotsAddresses: boolean;
  getBallotsManager: () => Contract<typeof BallotsManager.abi> | undefined;
  ballotsAddresses: string[];
  instantiateBallot: (
    address: string
  ) => Contract<typeof Ballot.abi> | undefined;
}

export const BallotsContext = createContext<BallotsContextType | undefined>(
  undefined
);

const PAGINATION_SIZE = 5;

interface Pagination {
  page?: number;
  total: number;
}

export const BallotsContextProvider: FC<BallotsContextProviderProps> = ({
  children,
}) => {
  const { ballotsManagerRef, getWeb3Provider } = useWeb3Context();
  const [allAddressPaginated, setAllAddressesPaginated] = useState(false);

  const [ballotsAddresses, setBallotsAddresses] = useState<string[]>([]);

  const [loadingBallotsAddresses, setLoadingBallotsAddresses] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: undefined,
    total: 0,
  });
  // const [currentPage, setCurrentPage] = useState<number | undefined>(0);

  // const paginateBallotsAddresses = useCallback(async (startAt: number) => {
  //   return [] as string[];
  // }, []);

  useEffect(() => {
    const contract = ballotsManagerRef?.current;
    if (!ballotsManagerRef || !contract) return;

    const subscription = contract.events.NewBallot();

    subscription.on("data", async (data) => {
      const id = data.returnValues["id"] as string;

      try {
        const _contract = ballotsManagerRef?.current;
        if (!ballotsManagerRef || !_contract) return;

        const address = await _contract.methods
          .ballotIdAddressMap(id)
          .call<string>();

        setPagination((p) => ({ ...p, total: p.total + 1 }));
        setBallotsAddresses((addresses) => [address, ...addresses]);
      } catch (error) {
        console.error("ballotIdAddressMap", { error });
      }
    });

    subscription.on("error", (error) => console.log({ error }));
    subscription.on("connected", (connected) => console.log({ connected }));
  }, [ballotsManagerRef, ballotsManagerRef.current]);

  useEffect(() => {
    console.log("try paginate");
    const ballotsManager = ballotsManagerRef.current;
    if (!ballotsManager) return;

    const runPagination = async () => {
      const { page, total } = pagination;
      if (page === undefined || total === 0) return;

      const startAt = page * PAGINATION_SIZE;
      console.log("@", { startAt });
      try {
        const newAddresses = await ballotsManager.methods
          .paginateBallots(startAt)
          .call<string[]>();

        setBallotsAddresses((addresses) => [...addresses, ...newAddresses]);
      } catch (error) {
        console.error("paginateBallots ", error);
      }
    };

    runPagination();
  }, [pagination.page, ballotsManagerRef]);

  // initial pagination
  useEffect(() => {
    const ballotsManager = ballotsManagerRef.current;
    if (!ballotsManager) return;

    const fetchBallotsLength = async () => {
      try {
        setLoadingBallotsAddresses(true);

        const totalBallotsBN = await ballotsManager.methods
          .currentBallotIdArrayLikeLength()
          .call<bigint>();

        const totalBallots = Number(totalBallotsBN);
        console.log({ totalBallots });
        if (!totalBallots) return;

        setPagination({ total: totalBallots, page: 0 });
      } catch (error) {
        console.error("currentBallotIdArrayLikeLength error", { error });
      } finally {
        setLoadingBallotsAddresses(false);
      }
    };

    fetchBallotsLength();
  }, [ballotsManagerRef, ballotsManagerRef.current]);

  const getBallotsManager = useCallback(
    () => ballotsManagerRef.current,
    [ballotsManagerRef, ballotsManagerRef.current]
  );

  const instantiateBallot = useCallback(
    (address: string) => {
      const web3 = getWeb3Provider();

      if (!web3) return;

      return instantiateContract(web3, Ballot.abi, address);
    },
    [getWeb3Provider]
  );

  // const fetchBallotContract = useCallback(
  //   async (address: string) => {
  //     const web3 = getWeb3Provider();

  //     if (!web3) return;

  //     const contract = instantiateContract(web3, Ballot.abi, address);

  //     try {
  //       const data = await contract.methods.getData().call<BallotData>();
  //       return data;
  //     } catch (error) {
  //       console.error("fetchBallotData", { error });
  //     }
  //   },
  //   [getWeb3Provider]
  // );

  const value = useMemo(
    () => ({
      instantiateBallot,
      loadingBallotsAddresses,
      getBallotsManager,
      ballotsAddresses,
    }),
    [
      instantiateBallot,
      loadingBallotsAddresses,
      getBallotsManager,
      ballotsAddresses,
      // ballotsAddresses.length,
    ]
  );
  return (
    <BallotsContext.Provider value={value}>{children}</BallotsContext.Provider>
  );
};
