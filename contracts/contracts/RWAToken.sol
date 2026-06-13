// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAToken
 * @dev ERC-721 NFT contract for tokenizing Real-World Assets.
 * @notice Only the contract owner can mint new tokens. Each token has
 *         a unique auto-incrementing ID and an associated metadata URI.
 */
contract RWAToken is ERC721, ERC721URIStorage, Ownable {
    /// @dev Next token ID to be minted (starts at 1).
    uint256 private _nextTokenId = 1;

    /// @notice Emitted when a new RWA token is minted.
    event TokenMinted(uint256 indexed tokenId, address indexed to, string tokenURI);

    /**
     * @dev Initializes the contract with name "RealWorldAsset" and symbol "RWA".
     *      Sets the deployer as the initial owner (OpenZeppelin v5 pattern).
     */
    constructor() ERC721("RealWorldAsset", "RWA") Ownable(msg.sender) {}

    /**
     * @notice Mints a new RWA token to the specified address with the given metadata URI.
     * @param to The address that will receive the minted token.
     * @param uri The metadata URI for the token (e.g., an IPFS or HTTPS URL).
     * @return tokenId The ID of the newly minted token.
     */
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit TokenMinted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @notice Returns the total number of tokens minted so far.
     * @return The count of minted tokens.
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ──────────────────────────────────────────────
    // Required overrides for ERC721 + ERC721URIStorage
    // ──────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
