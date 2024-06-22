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
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBallotsContext } from "../hooks/useBallotsContext";
import { DeserializedBallotData } from "../interfaces/deserialized-ballot-data.interface";
import { BallotImpl } from "../models/ballot-impl.model";
import { stringToHexColor } from "../functions/string-to-hex-color.function";
import { getComplementaryHexColor } from "../functions/get-complementary-hex-color.function";
import { BallotState } from "../enum/ballot-state.enum";
import { BallotTimeline } from "./BallotTimeline";
import { VotingTerm } from "../enum/voting-term.enum";
import BallotContract from "../assets/abi/Ballot.json";
import { Contract, PayableCallOptions } from "web3";
import { fireToast } from "../functions/fire-toast.function";
import { useWeb3Context } from "../hooks/useWeb3Context";
import {
  DeserializedVotingResults,
  VotingResults,
} from "../interfaces/voting-results.interface";

export interface CampaignProps {
  address: string;
}

export const Ballot: FC<CampaignProps> = ({ address }) => {
  const { selectedAccountAddress } = useWeb3Context();
  const { instantiateBallot } = useBallotsContext();
  const [data, setData] = useState<BallotImpl | undefined>();
  const lazyLoaderRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const observerRef = useRef<IntersectionObserver>();
  const contractRef = useRef<Contract<typeof BallotContract.abi>>();
  const [wasViewed, setWasViewed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [areDetailsOpen, setAreDetailsOpen] = useState(false);

  useEffect(() => {
    if (!lazyLoaderRef || !lazyLoaderRef.current) return;
    const loader = lazyLoaderRef.current;

    observerRef.current = new IntersectionObserver(
      (entries, observer) => {
        console.log({ entries });
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
    };
  }, []);

  useEffect(() => {
    if (!wasViewed) return;
    contractRef.current = instantiateBallot(address);

    if (!contractRef.current) return;
    const subscription = contractRef.current.events.VoteCast();

    subscription.on("data", async (data) => {
      const { accept, reject, total } = data.returnValues[
        "results"
      ] as DeserializedVotingResults;
      const votingResults: VotingResults = {
        accept: Number(accept),
        reject: Number(reject),
        total: Number(total),
      };

      setData((d) =>
        d ? ({ ...d, results: votingResults } as BallotImpl) : undefined
      );
    });

    setLoading(true);

    contractRef.current.methods
      .getData()
      .call<DeserializedBallotData>()
      .then((data) => setData(new BallotImpl(address, data)))
      .catch((error) => console.error("Ballot", { error }))
      .finally(() => setLoading(false));
  }, [instantiateBallot, address, setData, wasViewed]);

  const onCollapseChange = useCallback(
    (open: boolean) => setAreDetailsOpen(open),
    []
  );

  const castAcceptVote = useCallback(async () => {
    if (!contractRef.current || !selectedAccountAddress) return;

    try {
      const tx: PayableCallOptions = {
        from: selectedAccountAddress,
      };

      await contractRef.current.methods.castAcceptVote().send(tx);
      voteSuccessCallback();
    } catch (error) {
      fireToast("Error!", "Something went wrong", "error");

      console.error("castAcceptVote", error);
    }
  }, [selectedAccountAddress, contractRef, contractRef.current]);

  const castRejectVote = useCallback(async () => {
    if (!contractRef.current || !selectedAccountAddress) return;

    try {
      const tx: PayableCallOptions = {
        from: selectedAccountAddress,
      };

      await contractRef.current.methods.castRejectVote().send(tx);

      voteSuccessCallback();
    } catch (error) {
      fireToast("Error!", "Something went wrong", "error");

      console.error("castAcceptVote", error);
    }
  }, [selectedAccountAddress, contractRef, contractRef.current]);

  const voteSuccessCallback = useCallback(() => {
    fireToast("Success!", "Your accept vote was cast successfully", "success");

    setData((b) => (b ? { ...b, canVote: false } : undefined));
  }, []);

  const bgColor = useMemo(() => stringToHexColor(address), [address]);
  const textColor = useMemo(() => getComplementaryHexColor(bgColor), [bgColor]);

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
                <p className="card-title" style={{ color: textColor }}>
                  {data.title}
                </p>
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
                    <h2 className="card-title text-warning">It's a tie!</h2>
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
                  {data.canVote ? (
                    <>
                      <div className="tooltip" data-tip="NAY!">
                        <button
                          className="btn btn-circle btn-error btn-outline group"
                          onClick={castRejectVote}
                        >
                          <FontAwesomeIcon
                            className="text-lg text-error group-hover:text-neutral"
                            icon={faThumbsDown}
                          />
                        </button>
                      </div>
                      <div className="tooltip" data-tip="YAY!">
                        <button
                          className="btn btn-circle btn-success btn-outline group"
                          onClick={castAcceptVote}
                        >
                          <FontAwesomeIcon
                            className="text-lg text-success group-hover:text-neutral"
                            icon={faThumbsUp}
                          />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div role="alert" className="alert alert-success">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Your vote has been cast already.</span>
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
