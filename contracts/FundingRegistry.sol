// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FundingRegistry {

    struct Claim {
        string companyName;
        string approvedReason;
        uint256 amount;
        address submittedBy;
        uint256 timestamp;
    }

    Claim[] public claims;

    event ClaimPosted(
        uint256 indexed claimId,
        string companyName,
        string approvedReason,
        uint256 amount,
        address indexed submittedBy,
        uint256 timestamp
    );

    function postClaim(
        string calldata _companyName,
        string calldata _approvedReason,
        uint256 _amount
    ) external {

        uint256 claimId = claims.length;

        claims.push(
            Claim({
                companyName: _companyName,
                approvedReason: _approvedReason,
                amount: _amount,
                submittedBy: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit ClaimPosted(
            claimId,
            _companyName,
            _approvedReason,
            _amount,
            msg.sender,
            block.timestamp
        );
    }

    function getClaim(uint256 _claimId)
        external
        view
        returns (
            string memory companyName,
            string memory approvedReason,
            uint256 amount,
            address submittedBy,
            uint256 timestamp
        )
    {
        Claim memory claim = claims[_claimId];

        return (
            claim.companyName,
            claim.approvedReason,
            claim.amount,
            claim.submittedBy,
            claim.timestamp
        );
    }

    function getClaimCount()
        external
        view
        returns (uint256)
    {
        return claims.length;
    }
}