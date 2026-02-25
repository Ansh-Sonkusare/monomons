// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonomonsCollectible is ERC721, ERC721URIStorage, Ownable, VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface public vrfCoordinator;
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 200000;
    uint16 public requestConfirmations = 3;

    enum Rarity { Common, Uncommon, Rare, Epic, Legendary }
    
    struct RollRequest {
        address user;
        bool isCharacter;
        uint256 amountPaid;
    }

    mapping(uint256 => RollRequest) public rollRequests;
    mapping(uint8 => uint256) public raritySupply;
    mapping(uint8 => uint256) public rarityMaxSupply;
    mapping(uint256 => uint8) public tokenRarity;
    mapping(address => uint256[]) public ownedTokens;
    
    uint256 public nextTokenId;
    
    event RollRequested(address indexed user, uint256 requestId, bool isCharacter, uint256 fee);
    event RollFulfilled(address indexed user, uint256 tokenId, uint8 rarity, string rarityName);

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) ERC721("MonomonsCollectible", "MONO") VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        
        rarityMaxSupply[uint8(Rarity.Common)] = type(uint256).max;
        rarityMaxSupply[uint8(Rarity.Uncommon)] = 10000;
        rarityMaxSupply[uint8(Rarity.Rare)] = 5000;
        rarityMaxSupply[uint8(Rarity.Epic)] = 1000;
        rarityMaxSupply[uint8(Rarity.Legendary)] = 100;
    }

    function getCharacterFee(uint8 rarity) public pure returns (uint256) {
        if (rarity == uint8(Rarity.Common)) return 0.1 ether;
        if (rarity == uint8(Rarity.Uncommon)) return 0.25 ether;
        if (rarity == uint8(Rarity.Rare)) return 0.5 ether;
        if (rarity == uint8(Rarity.Epic)) return 1 ether;
        if (rarity == uint8(Rarity.Legendary)) return 5 ether;
        return 0.1 ether;
    }

    function getCardFee(uint8 rarity) public pure returns (uint256) {
        if (rarity == uint8(Rarity.Common)) return 0.05 ether;
        if (rarity == uint8(Rarity.Uncommon)) return 0.1 ether;
        if (rarity == uint8(Rarity.Rare)) return 0.25 ether;
        if (rarity == uint8(Rarity.Epic)) return 0.5 ether;
        if (rarity == uint8(Rarity.Legendary)) return 2 ether;
        return 0.05 ether;
    }

    function requestRoll(bool isCharacter) external payable returns (uint256 requestId) {
        require(msg.value >= 0.05 ether, "Insufficient payment");
        
        requestId = vrfCoordinator.requestRandomWords(
            keyHash, subscriptionId, requestConfirmations, callbackGasLimit, 1
        );
        
        rollRequests[requestId] = RollRequest({ user: msg.sender, isCharacter: isCharacter, amountPaid: msg.value });
        emit RollRequested(msg.sender, requestId, isCharacter, msg.value);
    }

    function fulfillRandomness(uint256 requestId, uint256[] memory randomWords) internal override {
        RollRequest memory req = rollRequests[requestId];
        require(req.user != address(0), "Invalid request");
        
        uint8 rarity = determineRarity(randomWords[0]);
        
        if (raritySupply[rarity] >= rarityMaxSupply[rarity]) {
            rarity = findAvailableRarity(randomWords[0]);
        }
        
        uint256 tokenId = nextTokenId++;
        _mint(req.user, tokenId);
        raritySupply[rarity]++;
        tokenRarity[tokenId] = rarity;
        ownedTokens[req.user].push(tokenId);
        
        emit RollFulfilled(req.user, tokenId, rarity, _rarityName(rarity));
        delete rollRequests[requestId];
    }

    function determineRarity(uint256 random) internal pure returns (uint8) {
        uint256 roll = random % 100;
        if (roll < 50) return 0;
        if (roll < 80) return 1;
        if (roll < 95) return 2;
        if (roll < 99) return 3;
        return 4;
    }

    function findAvailableRarity(uint256 random) internal view returns (uint8) {
        for (uint8 i = 0; i <= 4; i++) {
            if (raritySupply[i] < rarityMaxSupply[i]) return i;
        }
        revert("No available rarity");
    }

    function _rarityName(uint8 rarity) internal pure returns (string memory) {
        if (rarity == 0) return "Common";
        if (rarity == 1) return "Uncommon";
        if (rarity == 2) return "Rare";
        if (rarity == 3) return "Epic";
        return "Legendary";
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(from == address(0) || msg.sender == owner(), "Transfer only via platform");
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(from == address(0) || msg.sender == owner(), "Transfer only via platform");
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        require(from == address(0) || msg.sender == owner(), "Transfer only via platform");
        super.safeTransferFrom(from, to, tokenId);
    }

    function platformTransfer(address from, address to, uint256 tokenId) external onlyOwner {
        super.transferFrom(from, to, tokenId);
    }

    function getOwnedTokens(address owner) external view returns (uint256[] memory) {
        return ownedTokens[owner];
    }

    function getTokenRarity(uint256 tokenId) external view returns (uint8) {
        return tokenRarity[tokenId];
    }

    function getRaritySupply(uint8 rarity) external view returns (uint256) {
        return raritySupply[rarity];
    }

    function getRarityMaxSupply(uint8 rarity) external view returns (uint256) {
        return rarityMaxSupply[rarity];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
