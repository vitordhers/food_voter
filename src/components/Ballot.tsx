import {
  FC,
  MutableRefObject,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  faCheck,
  faCheckCircle,
  faXmark,
  faXmarkCircle,
  faEquals,
  faAlignJustify,
  faMedal,
  faClock,
  faThumbsUp,
  faThumbsDown,
  faCheckToSlot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBallotsContext } from "../hooks/useBallotsContext";
import { DeserializedBallotData } from "../interfaces/deserialized-ballot-data.interface";
import { BallotImpl } from "../models/ballot-impl.model";
import { stringToHexColor } from "../functions/string-to-hex-color.function";
import { BallotState } from "../enum/ballot-state.enum";
import { BallotTimeline } from "./BallotTimeline";
import { VotingTerm } from "../enum/voting-term.enum";
import BallotContract from "../assets/abi/Ballot.json";
import { Contract, EventLog, PayableCallOptions } from "web3";
import { fireToast } from "../functions/fire-toast.function";
import { useWeb3Context } from "../hooks/useWeb3Context";
import {
  DeserializedVotingResults,
  VotingResults,
} from "../interfaces/voting-results.interface";
import { getBallotState } from "../functions/get-ballot-state.function";
import metamaskLogo from "/metamask.svg";

export interface CampaignProps {
  address: string;
}

export const Ballot: FC<CampaignProps> = ({ address }) => {
  const { selectedAccountAddress, web3 } = useWeb3Context();
  const { instantiateBallot } = useBallotsContext();
  const [data, setData] = useState<BallotImpl | undefined>();
  const lazyLoaderRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const observerRef = useRef<IntersectionObserver>();
  const [ballotContract, setBallotContract] = useState<
    Contract<typeof BallotContract.abi> | undefined
  >();
  const [wasViewed, setWasViewed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [areDetailsOpen, setAreDetailsOpen] = useState(false);
  const [loadingVote, setLoadingVote] = useState(false);

  useEffect(() => {
    if (!lazyLoaderRef || !lazyLoaderRef.current) return;
    const loader = lazyLoaderRef.current;

    observerRef.current = new IntersectionObserver(
      (entries, observer) => {
        // console.log({ entries });
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setWasViewed(true);
          if (!lazyLoaderRef.current) return;
          observer.unobserve(lazyLoaderRef.current);
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5,
      }
    );

    observerRef.current.observe(lazyLoaderRef.current);

    return () => {
      if (!observerRef || !observerRef.current || !loader) return;
      observerRef.current.unobserve(loader);
      observerRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!wasViewed || !selectedAccountAddress) return;
    const contract = instantiateBallot(address);

    if (!contract) return;
    setBallotContract(contract);
    const subscription = contract.events.VoteCast();
    const dataCb = async (_data: EventLog) => {
      if (!_data) return;
      const { accept, reject, total } = _data.returnValues[
        "results"
      ] as DeserializedVotingResults;
      const updatedResults: VotingResults = {
        accept: Number(accept),
        reject: Number(reject),
        total: Number(total),
      };

      const updatedState = getBallotState(VotingTerm.Open, updatedResults);

      setData((d) =>
        d
          ? ({
              ...d,
              results: updatedResults,
              state: updatedState,
            } as BallotImpl)
          : undefined
      );
    };
    subscription.on("data", dataCb);
    const errorCb = (error: Error) => {
      console.log("ballot subscription error", error);
    };
    subscription.on("error", errorCb);

    setLoading(true);

    contract.methods
      .getData({ from: selectedAccountAddress })
      .call<DeserializedBallotData>({ from: selectedAccountAddress })
      .then((_data) =>
        !controller.signal.aborted
          ? setData(new BallotImpl(address, _data))
          : undefined
      )
      .catch((error) => console.error("Ballot", { error }))
      .finally(() => setLoading(false));

    return () => {
      subscription.off("data", dataCb);
      subscription.off("error", errorCb);
    };
  }, [instantiateBallot, address, setData, wasViewed, selectedAccountAddress]);

  const onCollapseChange = useCallback(
    (open: boolean) => setAreDetailsOpen(open),
    []
  );

  const voteSuccessCallback = useCallback(() => {
    fireToast("Success!", "Your accept vote was cast successfully", "success");

    setData((b) => (b ? { ...b, canVote: false } : undefined));
  }, []);

  const castAcceptVote = useCallback(async () => {
    if (!selectedAccountAddress || !ballotContract) return;

    try {
      setLoadingVote(true);
      const gasPrice = await web3.eth.getGasPrice();
      const tx: PayableCallOptions = {
        from: selectedAccountAddress,
        gasPrice: String(gasPrice),
      };

      await ballotContract.methods.castAcceptVote().send(tx);
      voteSuccessCallback();
    } catch (error) {
      fireToast("Error!", "Something went wrong", "error");

      console.error("castAcceptVote", error);
    } finally {
      setLoadingVote(false);
    }
  }, [web3, ballotContract, selectedAccountAddress, voteSuccessCallback]);

  const castRejectVote = useCallback(async () => {
    if (!selectedAccountAddress || !ballotContract) return;

    try {
      setLoadingVote(true);
      const gasPrice = await web3.eth.getGasPrice();
      const tx: PayableCallOptions = {
        from: selectedAccountAddress,
        gasPrice: String(gasPrice),
      };

      await ballotContract.methods.castRejectVote().send(tx);

      voteSuccessCallback();
    } catch (error) {
      fireToast("Error!", "Something went wrong", "error");

      console.error("castAcceptVote", error);
    } finally {
      setLoadingVote(false);
    }
  }, [web3, ballotContract, selectedAccountAddress, voteSuccessCallback]);

  const bgColor = useMemo(() => stringToHexColor(address), [address]);

  return (
    <div
      ref={lazyLoaderRef}
      className={`${!wasViewed ? "min-h-10 w-full" : ""}`}
    >
      <Suspense fallback={<div>Loading...</div>}>
        {data && !loading ? (
          <div className="flex justify-center items-center">
            <div className="card w-80 bg-base-100 shadow-xl">
              <div
                className="title flex justify-center items-center"
                style={{ backgroundColor: bgColor }}
              >
                <p className="card-title p-4">{data.title}</p>
              </div>
              <div className="card-body p-0">
                {data.state === BallotState.PreliminaryAccepted && (
                  <div className="flex items-center gap-2 p-4">
                    <FontAwesomeIcon
                      className="text-success text-xl"
                      icon={faCheck}
                    />
                    <h2 className="card-title text-success">
                      Accept is winning!
                    </h2>
                  </div>
                )}
                {data.state === BallotState.PreliminaryDraw && (
                  <div className="flex items-center gap-2 p-4">
                    <FontAwesomeIcon
                      className="text-warning text-xl"
                      icon={faEquals}
                    />
                    <h2 className="card-title text-warning">
                      {data.results.total === 0
                        ? "Cast the first vote!"
                        : "It's a tie!"}
                    </h2>
                  </div>
                )}
                {data.state === BallotState.PreliminaryRejected && (
                  <div className="flex items-center gap-2 p-4">
                    <FontAwesomeIcon
                      className="text-error text-xl"
                      icon={faXmark}
                    />
                    <h2 className="card-title text-error">
                      Reject is winning!
                    </h2>
                  </div>
                )}
                {data.state === BallotState.Accepted && (
                  <div className="flex items-center gap-2 p-4">
                    <FontAwesomeIcon
                      className="text-success text-xl"
                      icon={faCheckCircle}
                    />
                    <h2 className="card-title text-success">Accepted!</h2>
                  </div>
                )}
                {data.state === BallotState.Draw && (
                  <div className="flex items-center gap-2 p-4">
                    <FontAwesomeIcon
                      className="text-warning text-xl"
                      icon={faEquals}
                    />
                    <h2 className="card-title text-warning">It's a draw!</h2>
                  </div>
                )}
                {data.state === BallotState.Rejected && (
                  <div className="flex items-center gap-2 p-4">
                    <FontAwesomeIcon
                      className="text-error text-xl"
                      icon={faXmarkCircle}
                    />
                    <h2 className="card-title text-error">Rejected!</h2>
                  </div>
                )}
                <div tabIndex={0} className="collapse collapse-arrow p-0">
                  <input
                    type="checkbox"
                    onChange={(e) => onCollapseChange(e.target.checked)}
                  />
                  <div className="collapse-title p-4 text-xl font-medium bg-base-200">
                    Details
                  </div>
                  <div className="collapse-content bg-base-200">
                    <FontAwesomeIcon
                      className="text-md"
                      icon={faAlignJustify}
                    />
                    <span className="text-md mx-2">Description:</span>
                    <p className="text-sm">{data.description}</p>
                    <FontAwesomeIcon className="text-md" icon={faMedal} />
                    <span className="text-md mx-2">Results:</span>
                    <progress
                      className={`progress w-full ${
                        data.results.accept === data.results.reject
                          ? "bg-warning"
                          : data.results.accept > data.results.reject
                          ? "progress-success bg-error"
                          : "progress-error bg-success"
                      }`}
                      value={
                        data.results.accept > data.results.reject
                          ? data.results.accept
                          : data.results.reject
                      }
                      max={data.results.total || 100}
                    ></progress>
                    <div className="flex justify-around">
                      <div className="flex gap-4">
                        <div className="badge badge-success">
                          {data.results.accept}
                        </div>
                        <div className="badge badge-error">
                          {data.results.reject}
                        </div>
                      </div>
                      <div className="badge badge-neutral">
                        {data.results.total}
                      </div>
                    </div>
                    <FontAwesomeIcon className="text-md" icon={faClock} />
                    <span className="text-md mx-2">Timeline:</span>
                    {areDetailsOpen && (
                      <BallotTimeline
                        term={
                          data.state === BallotState.NotStarted
                            ? VotingTerm.NotStarted
                            : data.state === BallotState.PreliminaryAccepted ||
                              data.state === BallotState.PreliminaryRejected ||
                              data.state === BallotState.PreliminaryDraw
                            ? VotingTerm.Open
                            : VotingTerm.Closed
                        }
                        createdAt={data.createdAt}
                        expiresAt={data.closesAt}
                      />
                    )}
                  </div>
                </div>
                <div className="card-actions justify-around p-4">
                  {selectedAccountAddress ? (
                    data.canVote ? (
                      <>
                        <div className="tooltip" data-tip="NAY!">
                          <button
                            className="btn btn-circle btn-error btn-outline group"
                            onClick={castRejectVote}
                            disabled={loadingVote}
                          >
                            {loadingVote ? (
                              <span className="loading loading-ball loading-xs"></span>
                            ) : (
                              <FontAwesomeIcon
                                className="text-lg text-error group-hover:text-neutral"
                                icon={faThumbsDown}
                              />
                            )}
                          </button>
                        </div>
                        <div className="tooltip" data-tip="YAY!">
                          <button
                            className="btn btn-circle btn-success btn-outline group"
                            onClick={castAcceptVote}
                            disabled={loadingVote}
                          >
                            {loadingVote ? (
                              <span className="loading loading-ball loading-xs"></span>
                            ) : (
                              <FontAwesomeIcon
                                className="text-lg text-success group-hover:text-neutral"
                                icon={faThumbsUp}
                              />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        role="alert"
                        className="flex alert alert-success p-2"
                      >
                        <FontAwesomeIcon icon={faCheckToSlot} />
                        <span>Your vote has been cast already.</span>
                      </div>
                    )
                  ) : (
                    <div role="alert" className="flex alert alert-warning p-2">
                      <img className="metamask-logo" src={metamaskLogo} />
                      <span>Connect your wallet in order to vote.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <span className="loading loading-dots loading-lg"></span>
        )}
      </Suspense>
    </div>
  );
};
