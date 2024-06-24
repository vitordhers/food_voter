import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useBallotsContext } from "../hooks/useBallotsContext";
import { Ballot } from "../components/Ballot";
import { useWeb3Context } from "../hooks/useWeb3Context";
import metamaskLogo from "/metamask.svg";


export const Home: FC = () => {
  const { selectedAccountAddress } = useWeb3Context();
  const {
    loadingBallotsAddresses,
    ballotsAddresses,
    setPagination,
    pagination,
  } = useBallotsContext();

  const observerRef = useRef<IntersectionObserver>();

  const anchorRef: MutableRefObject<HTMLDivElement | null> = useRef(null);

  const allAddressPaginated = useMemo(
    () =>
      pagination.currentPageIndex !== undefined &&
      pagination.maxPageIndex !== undefined
        ? pagination.currentPageIndex > pagination.maxPageIndex
        : false,
    [pagination]
  );

  useEffect(() => {
    if (!anchorRef || !anchorRef.current || !ballotsAddresses.length) return;
    const loader = anchorRef.current;

    if (allAddressPaginated) {
      observerRef.current?.unobserve(loader);
      observerRef.current?.disconnect();
      return () => {
        if (!observerRef || !observerRef.current) return;
        observerRef.current.unobserve(loader);
        observerRef.current.disconnect();
      };
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (loadingBallotsAddresses) return;
          setPagination((p) => ({
            ...p,
            currentPageIndex:
              p.currentPageIndex === undefined
                ? undefined
                : p.currentPageIndex + 1,
          }));
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5,
      }
    );

    observerRef.current.observe(anchorRef.current);

    return () => {
      if (!observerRef || !observerRef.current || loader) return;
      observerRef.current.unobserve(loader);
      observerRef.current.disconnect();
    };
  }, [
    allAddressPaginated,
    loadingBallotsAddresses,
    ballotsAddresses,
    setPagination,
  ]);

  return (
    <div className="container mx-auto mt-6">
      {!ballotsAddresses.length ? (
        selectedAccountAddress ? (
          <div role="alert" className="alert w-auto m-8">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>No ballots were found</span>
          </div>
        ) : (
          <div role="alert" className="alert alert-warning w-auto m-8">
            <img className="metamask-logo" src={metamaskLogo} />
            <span>Connect to MetaMask to fetch ballots</span>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {ballotsAddresses.map((address) => (
            <Ballot key={address.substring(0, 13)} address={address} />
          ))}
        </div>
      )}
      {loadingBallotsAddresses && (
        <div className="flex gap-4 items-start justify-center">
          <span className="loading loading-dots loading-lg"></span>
          Loading Ballots
        </div>
      )}
      {allAddressPaginated && (
        <div role="alert" className="alert m-4">
          <span>All ballots have been loaded.</span>
        </div>
      )}
      {pagination.maxPageIndex ? (
        <div
          ref={anchorRef}
          id="pagination-anchor"
          className="w-full min-h-10"
        ></div>
      ) : null}
    </div>
  );
};
