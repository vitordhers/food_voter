// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Ballot {
    /// @notice Enum representing the state of the ballot
    enum State {
        NotStarted, /// Ballot has not started yet
        Open, /// Ballot is currently open for voting
        Closed /// Ballot has closed for voting
    }

    /// @notice Struct representing the voting results
    struct Results {
        uint64 accept; /// Number of votes accepting the proposal
        uint64 reject; /// Number of votes rejecting the proposal
        uint64 total; /// Total number of votes cast
    }

    struct Data {
        bytes32 id; /// Unique identifier of the ballot
        State state; /// Current state of the ballot
        bool isCreator; /// True if the message sender is the creator of the ballot
        uint256 createdAt; /// Timestamp when the ballot was created
        uint256 closesAt; /// Timestamp when the ballot will close
        string title; /// Ballot's title
        string description; /// Ballot's description
        bool canVote; /// True if the message sender can vote in the ballot
        Results results; /// Current voting results of the ballot
    }

    /// @notice Emitted when a vote is cast
    /// @param results The current voting results
    event VoteCast(Results results);

    bytes32 public id;
    string public title;
    address public creator;
    string public description;

    uint256 public createdAt = block.timestamp; /// Timestamp when the contract was created
    uint256 public closesAt = block.timestamp + 7 days; /// Timestamp when the ballot will close
    uint64 public acceptVotes = 0; /// Number of votes accepting the proposal
    uint64 public totalVotes = 0; /// Total number of votes cast
    mapping(address => bool) private voters; /// Mapping of addresses that have voted, should be private to enforce anonymity

    /// @notice Initializes the ballot with a creator, title, and description
    /// @param _creator The address of the ballot creator
    /// @param _title The title of the ballot (must be 50 characters or less)
    /// @param _description The description of the ballot (must be 200 characters or less)
    constructor(
        address _creator,
        string memory _title,
        string memory _description
    ) {
        require(
            bytes(_title).length <= 50,
            "Title must be 50 characters or less"
        );
        require(
            bytes(_description).length <= 200,
            "Description must be 200 characters or less"
        );
        title = _title;
        description = _description;
        creator = _creator;
        id = keccak256(abi.encodePacked(creator, createdAt));
    }

    /// @notice Ensures the ballot is open before proceeding
    /// @dev Checks if the ballot state is not NotStarted or Closed in order to cast votes
    modifier ballotIsOpen() {
        State _state = getState();
        require(_state != State.NotStarted, "Ballot hasn't started yet");
        require(_state != State.Closed, "Ballot no longer accept votes");
        _;
    }

    /// @notice Ensures the sender hasn't already voted before proceeding
    /// @dev Checks if the sender address is not in the voters mapping
    modifier onlyNewVoters() {
        require(!voters[msg.sender], "User has cast vote already");
        _;
    }

    /// @notice Gets the current state of the ballot regarding duration
    /// @return The current state of the ballot
    function getState() public view returns (State) {
        if (block.timestamp < createdAt) {
            return State.NotStarted;
        }
        if (block.timestamp > closesAt) {
            return State.Closed;
        }
        return State.Open;
    }

    /// @notice Casts an accept vote for the ballot
    /// @dev The ballot must be open and the sender must not have voted already
    function castAcceptVote() external ballotIsOpen onlyNewVoters {
        acceptVotes++;
        totalVotes++;
        voters[msg.sender] = true;
        Results memory _results = _getResults();
        emit VoteCast(_results);
    }

    /// @notice Casts a reject vote for the ballot
    /// @dev The ballot must be open and the sender must not have voted already
    function castRejectVote() external ballotIsOpen onlyNewVoters {
        totalVotes++;
        voters[msg.sender] = true;
        Results memory _results = _getResults();
        emit VoteCast(_results);
    }

    /// @notice Gets the data of the ballot
    /// @return The current data of the ballot including state, creator status, timestamps, title, description, voting eligibility, and results
    function getData() public view returns (Data memory) {
        State _state = getState();
        require(_state != State.NotStarted, "Ballot hasn't started yet");
        bool _canVote = _state == State.Open ? !voters[msg.sender] : false;
        bool _isCreator = isCreator();
        Results memory _results = _getResults();
        return
            Data(
                id,
                _state,
                _isCreator,
                createdAt,
                closesAt,
                title,
                description,
                _canVote,
                _results
            );
    }

    /// @dev Internal function to get the current results of the ballot
    /// @return The current results of the ballot including accept votes, reject votes, and total votes
    function _getResults() internal view returns (Results memory) {
        assert(totalVotes >= acceptVotes);
        uint64 rejectVotes = totalVotes - acceptVotes;
        return Results(acceptVotes, rejectVotes, totalVotes);
    }

    /// @notice Checks if the one fetching Data is Contract's creator
    /// @return result True if the sender is the creator, false otherwise
    function isCreator() public view returns (bool) {
        return (keccak256(abi.encodePacked(msg.sender, createdAt)) == id);
    }
}
