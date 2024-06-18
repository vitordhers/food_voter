// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract Ballot {
    enum State {
        Open,
        Approved,
        Rejected
    }

    struct BallotInfo {
        State state;
        uint256 created_at;
        uint256 closes_at;
        string title;
        string description;
        bool can_vote;
        uint64 approve_votes;
        uint64 total_votes;
    }

    string title;
    string description;
    address creator;
    uint256 created_at;
    uint256 closes_at;
    uint64 approve_votes;
    uint64 total_votes;
    mapping(address => bool) private voters;

    event NewVote(uint64 _approve_votes, uint64 _total_votes);

    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _created_at,
        uint256 _closes_at
    ) {
        creator = _creator;
        title = _title;
        description = _description;
        created_at = _created_at;
        closes_at = _closes_at;
        assert(closes_at >= created_at);
    }

    modifier ballotIsNotClosed() {
        require(closes_at >= block.timestamp, "Ballot no longer accept votes");
        _;
    }

    modifier onlyNewVoters() {
        require(!voters[msg.sender], "User has cast vote already");
        _;
    }

    function cast_approve_vote() external ballotIsNotClosed onlyNewVoters {
        approve_votes++;
        total_votes++;
        assert(total_votes >= approve_votes);
        emit NewVote(approve_votes, total_votes);
    }

    function cast_disapprove_vote() external ballotIsNotClosed onlyNewVoters {
        total_votes++;
        assert(total_votes >= approve_votes);
        emit NewVote(approve_votes, total_votes);
    }

    function get_info() public view returns (BallotInfo memory) {
        bool can_vote;
        State state;
        if (closes_at < block.timestamp) {
            !voters[msg.sender];
            state = State.Open;
        } else {
            can_vote = false;
            if (2 * approve_votes > total_votes) {
                state = State.Approved;
            } else {
                state = State.Rejected;
            }
        }

        return
            BallotInfo(
                state,
                created_at,
                closes_at,
                title,
                description,
                can_vote,
                approve_votes,
                total_votes
            );
    }
}
