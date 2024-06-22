import { BallotState } from "../enum/ballot-state.enum";
import { VotingTerm } from "../enum/voting-term.enum";
import { VotingResults } from "../interfaces/voting-results.interface";

export const getBallotState = (
  votingTerm: VotingTerm,
  { accept, reject }: VotingResults
) => {
  if (votingTerm === VotingTerm.NotStarted) return BallotState.NotStarted;

  if (votingTerm === VotingTerm.Open) {
    if (accept > reject) return BallotState.PreliminaryAccepted;
    if (accept < reject) return BallotState.PreliminaryRejected;
    return BallotState.PreliminaryDraw;
  }
  if (accept > reject) return BallotState.Accepted;
  if (accept < reject) return BallotState.Rejected;
  return BallotState.Draw;
};
