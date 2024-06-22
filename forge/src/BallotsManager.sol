// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./Ballot.sol";

/**
 * @title BallotsManager
 * @dev Manages the creation and pagination of Ballot contracts.
 */
contract BallotsManager {
    /// @notice Mapping from user address to an array of his ballot indices at ballotIdArrayLike.
    mapping(address => uint16[]) userBallotsMap;
    /// @notice ArrayLike mapping from index to ballot id.
    mapping(uint16 => bytes32) public ballotIdArrayLike;
    /// @notice Mapping from ballot ID to ballot address.
    mapping(bytes32 => address) public ballotIdAddressMap;

    /// @notice The size of each page for pagination.
    uint16 public paginationSize = 5;
    /// @notice The current length of ballotIdArrayLike.
    uint16 public currentBallotIdArrayLikeLength = 0;

    /// @notice Event emitted when a new ballot is created.
    event NewBallot(bytes32 id);

    /// @notice Error thrown when there are no ballots.
    error NoBallots();
    /// @notice Error thrown when a user has no ballots.
    error NoUserBallots();
    /// @notice Error thrown when the start index for pagination is invalid.
    error InvalidStartAt();

    /**
     * @notice Creates a new Ballot contract.
     * @param _title The title of the ballot.
     * @param _description The description of the ballot.
     * @return The address of the newly created Ballot contract.
     */
    function createBallot(
        string calldata _title,
        string calldata _description
    ) public returns (address) {
        /// instantiates new Ballot
        Ballot _newBallot = new Ballot(msg.sender, _title, _description);
        /// get its uid
        bytes32 _newBallotId = _newBallot.id();
        /// and the index it should occupy
        uint16 _newBallotIndex = currentBallotIdArrayLikeLength;
        /// set its uid in proper index
        ballotIdArrayLike[_newBallotIndex] = _newBallotId;
        /// get its address
        address _newBallotAddress = address(_newBallot);
        /// and set in ballotIdAddress map
        ballotIdAddressMap[_newBallotId] = _newBallotAddress;

        /// set referred in user's array relation
        userBallotsMap[msg.sender].push(_newBallotIndex);
        /// increase current length of ballotIdArrayLike so that next index can be set correctly
        currentBallotIdArrayLikeLength++;
        /// emits new ballot credentials
        emit NewBallot(_newBallotId);
        return _newBallotAddress;
    }

    /**
     * @notice Gets the number of ballots created by the caller.
     * @return The number of ballots created by the caller.
     */
    function getUserBallotsLength() public view returns (uint16) {
        return uint16(userBallotsMap[msg.sender].length);
    }

    /**
     * @notice Paginates all ballots starting from a specific index up to starting index + pagination size.
     * @param _startsAt The starting index for pagination, left included.
     * @return An array of ballot addresses.
     */
    function paginateBallots(
        uint16 _startsAt
    ) public view returns (address[] memory) {
        if (currentBallotIdArrayLikeLength == 0) {
            revert NoBallots();
        }
        if (_startsAt > currentBallotIdArrayLikeLength) {
            revert InvalidStartAt();
        }
        uint16 _endsAt = _startsAt + paginationSize >=
            currentBallotIdArrayLikeLength
            ? currentBallotIdArrayLikeLength
            : _startsAt + paginationSize;
        address[] memory _ballotsAddresses = new address[](_endsAt - _startsAt);
        uint16 _currentResultIndex = 0;
        for (uint16 _i = _startsAt; _i < _endsAt; _i++) {
            if (_i + 1 > currentBallotIdArrayLikeLength) {
                continue;
            }
            uint16 _invertedIndex = currentBallotIdArrayLikeLength - _i - 1;
            bytes32 _ballotId = ballotIdArrayLike[_invertedIndex];
            address _ballotAddress = ballotIdAddressMap[_ballotId];
            _ballotsAddresses[_currentResultIndex] = _ballotAddress;
            _currentResultIndex++;
        }
        return _ballotsAddresses;
    }

    /**
     * @notice Paginates the ballots created by the caller starting from a specific index up to startind index + pagination size.
     * @param _startsAt The starting index for pagination, left included.
     * @return An array of ballot addresses created by the caller.
     */
    function paginateUserBallots(
        uint16 _startsAt
    ) public view returns (address[] memory) {
        uint16[] memory _userBallotsIndices = userBallotsMap[msg.sender];
        uint16 _userBallotsLength = uint16(_userBallotsIndices.length);
        if (_userBallotsLength == 0) {
            revert NoUserBallots();
        }
        if (_startsAt > _userBallotsLength) {
            revert InvalidStartAt();
        }
        uint16 _endsAt = _startsAt + paginationSize >= _userBallotsLength
            ? _userBallotsLength
            : _startsAt + paginationSize;

        address[] memory _userBallotsAddresses = new address[](
            _endsAt - _startsAt
        );
        uint16 _currentResultIndex = 0;
        for (uint16 _i = _startsAt; _i < _endsAt; _i++) {
            if (_i + 1 > _userBallotsLength) {
                continue;
            }
            uint16 _invertedIndex = _userBallotsLength - _i - 1;
            uint16 _ballotIndex = _userBallotsIndices[_invertedIndex];
            bytes32 _ballotId = ballotIdArrayLike[_ballotIndex];
            address _ballotAddress = ballotIdAddressMap[_ballotId];
            _userBallotsAddresses[_currentResultIndex] = _ballotAddress;
            _currentResultIndex++;
        }
        return _userBallotsAddresses;
    }
}
