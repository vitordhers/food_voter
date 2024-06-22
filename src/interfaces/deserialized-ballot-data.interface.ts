import { DeserializedVotingResults } from "./voting-results.interface";

export interface DeserializedBallotData {
  state: bigint;
  canVote: boolean;
  createdAt: bigint;
  closesAt: bigint;
  isCreator: boolean;
  title: string;
  description: string;
  results: DeserializedVotingResults;
}
