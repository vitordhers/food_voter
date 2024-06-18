import { CAMPAIGN_DURATION_IN_MS } from "../const/campaign_duration_in_ms";
import { CampaignStatus } from "../enum/campaign-status";
import { VotingCampaignInterface } from "../interfaces/voting-campaign";

export class VotingCampaignImpl {
  status: CampaignStatus;
  title: string;
  description: string;
  approveVotes: number;
  totalVotes: number;
  creator: string;
  createdAt: number;
  updatedAt: number;
  finishesAt: number;

  constructor({
    title,
    description,
    approveVotes,
    totalVotes,
    creator,
    createdAt,
  }: VotingCampaignInterface) {
    this.title = title;
    this.description = description;
    this.approveVotes = approveVotes;
    this.totalVotes = totalVotes;
    this.creator = creator;

    this.createdAt = createdAt;
    this.finishesAt = createdAt + CAMPAIGN_DURATION_IN_MS;
    this.updatedAt = Date.now();
    if (this.updatedAt < this.finishesAt) {
      this.status = CampaignStatus.Open;
      return;
    }

    this.status =
      Math.round((this.approveVotes / this.totalVotes) * 100) / 100 > 0.5
        ? CampaignStatus.Approved
        : CampaignStatus.Rejected;
  }

  get rejectVotes() {
    return this.totalVotes - this.approveVotes;
  }
}
