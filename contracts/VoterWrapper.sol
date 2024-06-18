// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import "./Ballot.sol";

contract BallotsManager {
    address public owner;
    uint256 immutable duration = 604_800;

    address[] public ballots;
    mapping(address => uint256[]) user_ballots_map;

    address[] private test_ballots;
    mapping(address => uint256[]) test_ballots_map;

    event NewBallot(address _address);
    event NewTestBallot(address _address);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    modifier titleAndDescriptionLimit(
        string memory _title,
        string memory _description
    ) {
        require(
            bytes(_title).length <= 25,
            "Title must be 25 characters or less"
        );
        require(
            bytes(_description).length <= 200,
            "Description must be 200 characters or less"
        );
        _;
    }

    function createBallot(
        string memory _title,
        string memory _description
    ) public titleAndDescriptionLimit(_title, _description) {
        uint256 created_at = block.timestamp;
        uint256 closes_at = created_at + duration;
        Ballot new_ballot = new Ballot(
            msg.sender,
            _title,
            _description,
            created_at,
            closes_at
        );
        address new_ballot_address = address(new_ballot);
        ballots.push(new_ballot_address);
        uint256 ballot_index = ballots.length;
        user_ballots_map[msg.sender].push(ballot_index);
        emit NewBallot(new_ballot_address);
    }

    function getUserBallots() public view returns (address[] memory) {
        uint256[] memory user_ballots_indices = user_ballots_map[msg.sender];

        address[] memory addresses = new address[](0);

        if (user_ballots_indices.length == 0) {
            return addresses;
        }

        for (uint i = 0; i < user_ballots_indices.length; i++) {
            addresses[i] = ballots[user_ballots_indices[i]];
        }
        return addresses;
    }

    function createTestBallot(
        string memory _title,
        string memory _description,
        uint256 created_at,
        uint256 closes_at
    ) public onlyOwner titleAndDescriptionLimit(_title, _description) {
        Ballot new_test_ballot = new Ballot(
            msg.sender,
            _title,
            _description,
            created_at,
            closes_at
        );

        address new_test_ballot_address = address(new_test_ballot);
        test_ballots.push(new_test_ballot_address);
        uint256 ballot_index = ballots.length;
        test_ballots_map[msg.sender].push(ballot_index);
        emit NewTestBallot(new_test_ballot_address);
    }
}
