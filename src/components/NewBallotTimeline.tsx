import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "../functions/format-date.function";
import { formatTime } from "../functions/format-time.function";
import {
  faComment,
  faPersonBooth,
  faAward,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUiContext } from "../hooks/useUiContext";

export const NewBallotTimeline = () => {
  const { isCreatingNewBallot } = useUiContext();
  const [expiresAt, setExpiresAt] = useState<number | undefined>(); // time in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ballotEndsAt = new Date();
    ballotEndsAt.setMilliseconds(0);
    ballotEndsAt.setDate(ballotEndsAt.getDate() + 7);

    setExpiresAt(ballotEndsAt.getTime() / 1000);
  }, []);

  useEffect(() => {
    if (expiresAt === undefined) return;
    intervalRef.current = setInterval(() => {
      if (expiresAt > 0) {
        return setExpiresAt((prevTime) =>
          prevTime !== undefined ? prevTime + 1 : undefined
        );
      }
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
    }, 1000);

    return () => {
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
    };
  }, [expiresAt]);

  const formattedDateTime = useMemo(() => {
    if (!expiresAt) return;
    const date = new Date(expiresAt * 1000);
    return [formatDate(date), formatTime(date)];
  }, [expiresAt]);

  return (
    <ul className="timeline timeline-vertical md:timeline-horizontal">
      <li>
        <div className="timeline-start timeline-box">Create ballot</div>
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
            isCreatingNewBallot && expiresAt && expiresAt % 2
              ? "bg-primary"
              : ""
          }`}
        />
        <div className="timeline-middle">
          <FontAwesomeIcon icon={faPersonBooth} />
        </div>
        {formattedDateTime && (
          <div className="timeline-end timeline-box">
            People cast votes until
            <br />
            {formattedDateTime[0]}
            <br />
            at {formattedDateTime[1]}
          </div>
        )}

        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-start timeline-box">Get results</div>
        <div className="timeline-middle">
          <FontAwesomeIcon icon={faAward} />
        </div>
      </li>
    </ul>
  );
};
