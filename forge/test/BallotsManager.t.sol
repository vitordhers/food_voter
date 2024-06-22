// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {BallotsManager, Ballot} from "../src/BallotsManager.sol";

contract BallotsManagerTest is Test {
    BallotsManager public ballotsManager;
    string validTitle = "Acceptable title";
    string validDesc = "Acceptable description";
    uint256 startsAt;
    address creator0;
    address creator1;
    address creator2;

    function setUp() public {
        ballotsManager = new BallotsManager();
        startsAt = block.timestamp;
        creator0 = msg.sender;
        creator1 = address(0x0);
        creator2 = address(0x1);

        // Define the amount of Ether to send (1 ether in this example)
        uint256 amount = 1 ether;

        // Call the receiveEther method and send Ether
        (bool success, ) = address(0x5FbDB2315678afecb367f032d93F642f64180aa3)
            .call{value: amount}(abi.encodeWithSignature("receiveEther()"));
        assertTrue(success);
    }

    // <> Helper functions
    function generateUid(
        address _address,
        uint256 timestamp
    ) internal pure returns (bytes32 result) {
        return keccak256(abi.encodePacked(_address, timestamp));
    }

    function runBallotCreationRounds(
        uint16 _creationRounds
    ) internal returns (address[] memory createdContracts) {
        address[] memory _creators = new address[](3);
        _creators[0] = creator0;
        _creators[1] = creator1;
        _creators[2] = creator2;

        /// since each round creates 3 contracts, expect to receive 3 * creationRounds contracts
        uint16 _ballotsExpectedLength = _creationRounds * 3;
        address[] memory _contracts = new address[](_ballotsExpectedLength);

        uint16 _cursor = 0;
        for (uint16 i = 0; i < _creationRounds; i++) {
            skip(10);
            _contracts[_cursor] = ballotsManager.createBallot(
                validTitle,
                validDesc
            );
            _cursor++;
            vm.startPrank(_creators[1]);
            skip(5);
            _contracts[_cursor] = ballotsManager.createBallot(
                validTitle,
                validDesc
            );
            _cursor++;
            vm.stopPrank();
            console.log("b4 start prank2");
            vm.startPrank(_creators[2]);
            skip(15);
            _contracts[_cursor] = ballotsManager.createBallot(
                validTitle,
                validDesc
            );
            _cursor++;
            vm.stopPrank();
        }

        return _contracts;
    }

    // </> Helper functions

    // <> Test functions
    function testFuzz_TitleAndDescriptionLimits(
        string calldata _title,
        string calldata _desc
    ) public {
        if (bytes(_title).length > 50) {
            vm.expectRevert(bytes("Title must be 50 characters or less"));
        }
        ballotsManager.createBallot(_title, validDesc);
        if (bytes(_desc).length > 200) {
            vm.expectRevert(
                bytes("Description must be 200 characters or less")
            );
        }
        ballotsManager.createBallot(validTitle, _desc);
    }

    function testNewBallotEventAndUid() public {
        bytes32 _testBallotExpectedId = generateUid(address(this), startsAt);
        vm.expectEmit();
        emit BallotsManager.NewBallot(_testBallotExpectedId);
        ballotsManager.createBallot(validTitle, validDesc);

        skip(100);
        vm.startPrank(creator0);
        bytes32 _creatorBallotExpectedId = generateUid(
            creator0,
            block.timestamp
        );
        vm.expectEmit();
        emit BallotsManager.NewBallot(_creatorBallotExpectedId);
        ballotsManager.createBallot(validTitle, validDesc);
        vm.stopPrank();
    }

    function testBallotIdAddressMap() public {
        bytes32 _testBallotExpectedId = generateUid(address(this), startsAt);
        address _testBallotAddress = ballotsManager.createBallot(
            validTitle,
            validDesc
        );
        assertEq(
            ballotsManager.ballotIdAddressMap(_testBallotExpectedId),
            _testBallotAddress
        );

        skip(100);
        vm.startPrank(creator0);
        bytes32 _creatorBallotExpectedId = generateUid(
            creator0,
            block.timestamp
        );
        address _creatorBallotAddress = ballotsManager.createBallot(
            validTitle,
            validDesc
        );
        assertEq(
            ballotsManager.ballotIdAddressMap(_creatorBallotExpectedId),
            _creatorBallotAddress
        );
        vm.stopPrank();
    }

    function testCurrentBallotIdArrayLikeLength() public {
        assertEq(ballotsManager.currentBallotIdArrayLikeLength(), 0);
        ballotsManager.createBallot(validTitle, validDesc);
        assertEq(ballotsManager.currentBallotIdArrayLikeLength(), 1);

        skip(100);
        vm.startPrank(creator0);
        ballotsManager.createBallot(validTitle, validDesc);
        assertEq(ballotsManager.currentBallotIdArrayLikeLength(), 2);
        vm.stopPrank();

        skip(250);
        vm.startPrank(creator1);
        ballotsManager.createBallot(validTitle, validDesc);
        assertEq(ballotsManager.currentBallotIdArrayLikeLength(), 3);
        vm.stopPrank();
    }

    function testPaginationErrors() public {
        vm.expectRevert(BallotsManager.NoBallots.selector);
        ballotsManager.paginateBallots(0);
        vm.expectRevert(BallotsManager.NoUserBallots.selector);
        ballotsManager.paginateUserBallots(0);

        ballotsManager.createBallot(validTitle, validDesc);
        vm.expectRevert(BallotsManager.InvalidStartAt.selector);
        ballotsManager.paginateBallots(2);
        vm.expectRevert(BallotsManager.InvalidStartAt.selector);
        ballotsManager.paginateUserBallots(2);
    }

    function testInvertedPagination() public {
        address[] memory _contracts = runBallotCreationRounds(6);
        uint16 _ballotIdArrayLength = ballotsManager
            .currentBallotIdArrayLikeLength();
        uint16 _paginationSize = ballotsManager.paginationSize();

        /// get pagination rounds by checking if ballotIdArray is perfectly divisible by pagination size
        uint16 _paginationRounds = _ballotIdArrayLength % _paginationSize == 0 /// if so, get the number of pagination rounds needed to cover ballotIdArray fully
            ? _ballotIdArrayLength / _paginationSize /// otherwise, just add another iteration to cover the resting values
            : (_ballotIdArrayLength / _paginationSize) + 1;

        for (
            uint16 _paginationIter = 0;
            _paginationIter < _paginationRounds;
            _paginationIter++
        ) {
            uint16 _startsAt = _paginationIter * _paginationSize;
            address[] memory _results = ballotsManager.paginateBallots(
                _startsAt
            );

            uint16 _endsAt = _startsAt + _paginationSize >= _ballotIdArrayLength
                ? _ballotIdArrayLength
                : _startsAt + _paginationSize;

            for (uint16 _index = 0; _index < _paginationSize; _index++) {
                uint16 _createdContractIndex = _startsAt + _index;
                if (
                    _createdContractIndex >= _endsAt ||
                    _createdContractIndex + 1 > _ballotIdArrayLength
                ) {
                    continue;
                }

                uint16 _invertedIndex = _ballotIdArrayLength -
                    _createdContractIndex -
                    1;

                assertEq(_contracts[_invertedIndex], _results[_index]);
            }
        }
    }

    function testUserPagination() public {
        runBallotCreationRounds(6);

        uint16 _userBallotsLength = ballotsManager.getUserBallotsLength();

        uint16 _paginationSize = ballotsManager.paginationSize();
        uint16 _paginationRounds = _userBallotsLength % _paginationSize == 0
            ? _userBallotsLength / _paginationSize
            : (_userBallotsLength / _paginationSize) + 1;

        for (
            uint16 _paginationIter = 0;
            _paginationIter < _paginationRounds;
            _paginationIter++
        ) {
            uint16 _startsAt = _paginationIter * _paginationSize;
            address[] memory _results = ballotsManager.paginateUserBallots(
                _startsAt
            );

            uint16 _endsAt = _startsAt + _paginationSize >= _userBallotsLength
                ? _userBallotsLength
                : _startsAt + _paginationSize;

            for (uint16 _index = 0; _index < _paginationSize; _index++) {
                uint16 _createdContractIndex = _startsAt + _index;
                if (_createdContractIndex >= _endsAt) {
                    continue;
                }
                Ballot _ballot = Ballot(_results[_index]);
                assertTrue(_ballot.isCreator());
            }
        }
    }

    // <> Test functions
}
