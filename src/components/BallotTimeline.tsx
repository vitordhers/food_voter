import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "../functions/format-date.function";
import { formatTime } from "../functions/format-time.function";
import {
  faComment,
  faPersonBooth,
  faAward,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VotingTerm } from "../enum/voting-term.enum";

interface BallotTimelineProps {
  term: VotingTerm;
  createdAt: number;
  expiresAt: number;
}

export const BallotTimeline: FC<BallotTimelineProps> = (
  { term, createdAt, expiresAt } // time in seconds
) => {
  const [remainingTime, setRemainingTime] = useState<number | undefined>(
    Date.now() / 1000 - createdAt
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setMilliseconds(0);
    const timestampDiff = expiresAt * 1000 - now.getTime();
    if (timestampDiff < 0) return setRemainingTime(0);

    setRemainingTime(timestampDiff / 1000);
  }, [expiresAt]);

  useEffect(() => {
    if (expiresAt === undefined || term !== VotingTerm.Open) return;
    intervalRef.current = setInterval(() => {
      if (expiresAt > 0) {
        return setRemainingTime((prevTime) =>
          prevTime !== undefined ? prevTime - 1 : undefined
        );
      }
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
    }, 1000);

    return () => {
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
    };
  }, [expiresAt, term]);

  const formattedStartDateTime = useMemo(() => {
    if (!createdAt) return;
    const date = new Date(createdAt * 1000);
    return [formatDate(date), formatTime(date)];
  }, [createdAt]);

  const formattedEndDateTime = useMemo(() => {
    if (!createdAt) return;
    const date = new Date(createdAt * 1000);
    return [formatDate(date), formatTime(date)];
  }, [createdAt]);

  const remainingTimeUnits = useMemo(() => {
    if (!remainingTime) return;

    const days = Math.floor(remainingTime / (60 * 60 * 24));
    const hours = Math.floor((remainingTime % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
    const seconds = Math.floor(remainingTime % 60);

    return {
      days,
      hours,
      minutes,
      seconds,
    };
  }, [remainingTime]);

  return (
    <>
      <ul className="timeline timeline-vertical">
        <li>
          <div className="timeline-start timeline-box">
            Ballot created{" "}
            {formattedStartDateTime && (
              <>
                {formattedStartDateTime[0]}
                <br />
                at {formattedStartDateTime[1]}
              </>
            )}
            <br />
          </div>
          <hr className="bg-primary" />
        </li>
        <li>
          <hr className="bg-primary" />
          <div className="timeline-middle">
            <FontAwesomeIcon className="text-primary" icon={faComment} />
          </div>
          <hr className="bg-primary" />
        </li>
        <li>
          <hr
            className={`${
              term < VotingTerm.Open
                ? remainingTime && remainingTime % 2
                  ? "bg-primary"
                  : ""
                : "bg-primary"
            }`}
          />
          <div className="timeline-middle">
            <FontAwesomeIcon
              className={term >= VotingTerm.Open ? "text-primary" : ""}
              icon={faPersonBooth}
            />
          </div>
          {formattedEndDateTime && (
            <div className="timeline-end timeline-box">
              People cast votes until
              <br />
              {formattedEndDateTime[0]}
              <br />
              at {formattedEndDateTime[1]}
            </div>
          )}

          <hr
            className={`${
              term < VotingTerm.Closed
                ? remainingTime && remainingTime % 2
                  ? "bg-primary"
                  : ""
                : "bg-primary"
            }`}
          />
        </li>
        <li>
          <hr className={`${term === VotingTerm.Closed ? "bg-primary" : ""}`} />
          <div className="timeline-start timeline-box">
            {term === VotingTerm.Closed ? "Final" : "See partial"} results
          </div>
          <div className="timeline-middle">
            <FontAwesomeIcon
              className={`${term === VotingTerm.Closed ? "bg-primary" : ""}`}
              icon={faAward}
            />
          </div>
        </li>
      </ul>
      {term === VotingTerm.Open && remainingTimeUnits && (
        <div className="timeline-end timeline-box">
          <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
              <span className="countdown font-mono text-sm">
                <span
                  style={
                    { "--value": remainingTimeUnits.days } as CSSProperties
                  }
                ></span>
              </span>
              days
            </div>
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
              <span className="countdown font-mono text-sm">
                <span
                  style={
                    { "--value": remainingTimeUnits.hours } as CSSProperties
                  }
                ></span>
              </span>
              hours
            </div>
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
              <span className="countdown font-mono text-sm">
                <span
                  style={
                    { "--value": remainingTimeUnits.minutes } as CSSProperties
                  }
                ></span>
              </span>
              min
            </div>
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
              <span className="countdown font-mono text-sm">
                <span
                  style={
                    { "--value": remainingTimeUnits.seconds } as CSSProperties
                  }
                ></span>
              </span>
              sec
            </div>
          </div>
        </div>
      )}
    </>
  );
};
