// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CouponNFT is ERC721, Ownable {
    mapping(uint256 => string) private _couponURI;
    mapping(uint256 => bool) public couponMinted;
    uint256 public immutable maxCoupons;

    constructor(uint256 _maxCoupons) ERC721("CouponNFT", "CPN") Ownable(msg.sender) {
        maxCoupons = _maxCoupons;
    }

    function setCouponURI(uint256 couponId, string calldata uri) external onlyOwner {
        require(couponId < maxCoupons, "invalid coupon id");
        _couponURI[couponId] = uri;
    }

    function mintCoupon(uint256 couponId) external {
        require(couponId < maxCoupons, "invalid coupon id");
        require(!couponMinted[couponId], "coupon already minted");

        couponMinted[couponId] = true;
        _safeMint(msg.sender, couponId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // FIXED LINE ↓↓↓
        require(_ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");

        return _couponURI[tokenId];
    }
}
