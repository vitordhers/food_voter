import { BallotState } from "../enum/ballot-state.enum";
import { getBallotState } from "../functions/get-ballot-state.function";
import { DeserializedBallotData } from "../interfaces/deserialized-ballot-data.interface";
import { VotingResults } from "../interfaces/voting-results.interface";

export class BallotImpl {
  address: string;
  title: string;
  description: string;
  createdAt: number;
  closesAt: number;
  canVote: boolean;
  isCreator: boolean;
  results: VotingResults;
  state: BallotState;

  constructor(
    address: string,
    {
      title,
      description,
      createdAt,
      closesAt,
      canVote,
      isCreator,
      results,
      state,
    }: DeserializedBallotData
  ) {
    this.address = address;
    this.title = title;
    this.description = description;
    this.createdAt = Number(createdAt);
    this.closesAt = Number(closesAt);
    this.canVote = canVote;
    this.isCreator = isCreator;

    this.results = {
      accept: Number(results.accept),
      reject: Number(results.reject),
      total: Number(results.total),
    };
    this.state = getBallotState(Number(state), this.results);
  }
}
