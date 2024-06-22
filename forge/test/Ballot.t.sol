// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Ballot} from "../src/Ballot.sol";

contract BallotTest is Test {
    Ballot ballot;
    string title = unicode"🍲 sopa é janta?";
    string description = "Sopa pode ser considerada janta?";
    uint256 startsAt;
    uint256 endsAt;
    address creator;
    address voter1 = address(0x0);
    address voter2 = address(0x1);
    bytes32 id;

    function setUp() public {
        creator = msg.sender;
        skip(1000);
        ballot = new Ballot(creator, title, description);
        startsAt = ballot.createdAt();
        endsAt = ballot.closesAt();
        id = ballot.id();
    }

    // <> Helper functions
    function generateUid(
        address _address,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_address, timestamp));
    }

    function assertDataEq(
        Ballot.Data memory _lhs,
        Ballot.Data memory _rhs
    ) internal pure {
        assertEq(_lhs.id, _rhs.id);
        assertEq(_lhs.isCreator, _rhs.isCreator);
        assertEq(uint(_lhs.state), uint(_rhs.state));
        assertEq(_lhs.createdAt, _rhs.createdAt);
        assertEq(_lhs.closesAt, _rhs.closesAt);
        assertEq(_lhs.title, _rhs.title);
        assertEq(_lhs.description, _rhs.description);
        assertEq(_lhs.canVote, _rhs.canVote);
        assertEq(_lhs.results.accept, _rhs.results.accept);
        assertEq(_lhs.results.reject, _rhs.results.reject);
        assertEq(_lhs.results.total, _rhs.results.total);
    }

    function createExpectedBallotData(
        bytes32 _id,
        bool _isCreator,
        Ballot.State _state,
        bool _canVote,
        Ballot.Results memory _results
    ) internal view returns (Ballot.Data memory) {
        return
            Ballot.Data(
                _id,
                _state,
                _isCreator,
                startsAt,
                endsAt,
                title,
                description,
                _canVote,
                _results
            );
    }

    // </> Helper functions

    // <> Test functions
    function testCheckIdUniqueness() public {
        /// checks for impromptu generated id
        bytes32 _shouldBeCorrectId = generateUid(creator, startsAt);
        assertEq(_shouldBeCorrectId, id);
        /// changes timestamp to verify id uniqueness
        skip(1);
        bytes32 _shouldNotBeCorrectId1 = generateUid(creator, block.timestamp);
        assertNotEq(_shouldNotBeCorrectId1, id);

        /// change caller to verify id uniqueness
        bytes32 _shouldNotBeCorrectId2 = generateUid(voter1, startsAt);
        assertNotEq(_shouldNotBeCorrectId2, id);
    }

    function testVotingPeriod() public {
        rewind(100);
        Ballot.State _shouldBeNotStartedState = ballot.getState();
        assertEq(uint(_shouldBeNotStartedState), uint(Ballot.State.NotStarted));
        vm.expectRevert(bytes("Ballot hasn't started yet"));
        ballot.castAcceptVote();

        skip(100);
        Ballot.State _shouldBeOpenState = ballot.getState();
        assertEq(uint(_shouldBeOpenState), uint(Ballot.State.Open));

        vm.warp(endsAt + 1);
        Ballot.State _shouldBeClosedState = ballot.getState();
        assertEq(uint(_shouldBeClosedState), uint(Ballot.State.Closed));
        vm.expectRevert(bytes("Ballot no longer accept votes"));
        ballot.castAcceptVote();
    }

    function testVoteAccept() public {
        ballot.castAcceptVote();
        assertEq(ballot.acceptVotes(), 1);
        assertEq(ballot.totalVotes(), 1);
    }

    function testVoteReject() public {
        ballot.castRejectVote();
        assertEq(ballot.acceptVotes(), 0);
        assertEq(ballot.totalVotes(), 1);
    }

    /// @notice as the BallotTest is calling tested contract, expected address on tested contract for msg.sender should be BallotTest's address
    function testCreatorCanVote() public {
        vm.startPrank(creator);
        ballot.castAcceptVote();
        assertEq(ballot.acceptVotes(), 1);
        assertEq(ballot.totalVotes(), 1);
        vm.stopPrank();
    }

    function testDenyDoubleVoting() public {
        ballot.castAcceptVote();
        vm.expectRevert(bytes("User has cast vote already"));
        ballot.castAcceptVote();
        vm.expectRevert(bytes("User has cast vote already"));
        ballot.castRejectVote();
    }

    function testMultipleVotes() public {
        ballot.castRejectVote();

        assertEq(ballot.acceptVotes(), 0);
        assertEq(ballot.totalVotes(), 1);

        vm.startPrank(creator);
        ballot.castAcceptVote();
        assertEq(ballot.acceptVotes(), 1);
        assertEq(ballot.totalVotes(), 2);
        vm.stopPrank();

        vm.startPrank(voter1);
        ballot.castAcceptVote();
        assertEq(ballot.acceptVotes(), 2);
        assertEq(ballot.totalVotes(), 3);
        vm.stopPrank();

        vm.startPrank(voter2);
        ballot.castAcceptVote();
        assertEq(ballot.acceptVotes(), 3);
        assertEq(ballot.totalVotes(), 4);
        vm.stopPrank();
    }

    function testCastVoteEvent() public {
        vm.expectEmit();
        emit Ballot.VoteCast(Ballot.Results(1, 0, 1));
        ballot.castAcceptVote();
        vm.startPrank(voter1);
        emit Ballot.VoteCast(Ballot.Results(1, 1, 2));
        ballot.castRejectVote();
        vm.stopPrank();
    }

    function testGetData() public {
        rewind(100);
        vm.expectRevert(bytes("Ballot hasn't started yet"));
        ballot.getData();
        skip(100);

        bytes32 _id = generateUid(msg.sender, ballot.createdAt());

        Ballot.State _openState = Ballot.State.Open;

        Ballot.Results memory _pristineBallotResults = Ballot.Results(0, 0, 0);

        Ballot.Data memory _pristineBallotData = createExpectedBallotData(
            _id,
            false, /// check testCreatorCanVote @notice
            _openState,
            true,
            _pristineBallotResults
        );

        Ballot.Data memory _step0Data = ballot.getData();
        assertDataEq(_pristineBallotData, _step0Data);

        vm.startPrank(creator);
        // prank in order get data for creator and cast a new vote
        ballot.castAcceptVote();
        Ballot.Results memory _firstVoteResults = Ballot.Results(1, 0, 1);
        Ballot.Data memory _firstVoteData = createExpectedBallotData(
            _id,
            true, /// check testCreatorCanVote @notice
            _openState,
            false,
            _firstVoteResults
        );
        Ballot.Data memory _step1Data = ballot.getData();
        assertDataEq(_firstVoteData, _step1Data);
        vm.stopPrank();

        // prank in order get data for voter1 and cast a new vote
        vm.startPrank(voter1);

        Ballot.Data memory _openBallotData = createExpectedBallotData(
            _id,
            false,
            _openState,
            true,
            _firstVoteResults
        );
        Ballot.Data memory _step2Data = ballot.getData();
        assertDataEq(_openBallotData, _step2Data);
        ballot.castRejectVote();
        Ballot.Results memory _secondVoteResults = Ballot.Results(1, 1, 2);
        Ballot.Data memory _secondVoteBallotData = createExpectedBallotData(
            _id,
            false,
            _openState,
            false,
            _secondVoteResults
        );
        Ballot.Data memory _step3Data = ballot.getData();
        assertDataEq(_secondVoteBallotData, _step3Data);
        vm.stopPrank();
        vm.warp(endsAt + 1);
        Ballot.State _closedState = Ballot.State.Closed;
        Ballot.Data memory _closedBallotData = createExpectedBallotData(
            _id,
            false, /// check testCreatorCanVote @notice
            _closedState,
            false,
            _secondVoteResults
        );
        Ballot.Data memory _step4Data = ballot.getData();
        assertDataEq(_closedBallotData, _step4Data);
    }
    // </> Test functions
}
