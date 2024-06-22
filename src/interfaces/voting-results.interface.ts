export interface VotingResults {
  accept: number;
  reject: number;
  total: number;
}

export interface DeserializedVotingResults {
  accept: bigint;
  reject: bigint;
  total: bigint;
}
