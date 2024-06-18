export interface VotingCampaignInterface {
  approveVotes: number;
  totalVotes: number;
  title: string;
  description: string;
  createdAt: number; //timestamp in ms,
  creator: string;
}
