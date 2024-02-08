// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrustedDataMule {
    struct User {
        bool isRegistered;
        string publicKey;
    }

    struct Recipient {
        bool isRegistered;
        string id_d;
        string port;
        string ip_address;
    }

    struct DataMule {
        bool isRegistered;
        uint accumulatedTokens;
    }

    mapping(address => User) public usersByAddress;
    mapping(bytes32 => Recipient) public recipientDetails;
    mapping(address => DataMule) public dataMules;

    function registerUser(address publicAddress, string memory publicKey) public {
        require(!usersByAddress[publicAddress].isRegistered, "User already registered");
        usersByAddress[publicAddress] = User(true, publicKey);
    }

    // Funzione per registrare un destinatario con la sua chiave pubblica, ID e informazioni di contatto
    function registerRecipient(string memory id_d, string memory port, string memory ip_address) public {
        bytes32 id_d_bytes = keccak256(abi.encodePacked(id_d));
        require(!recipientDetails[id_d_bytes].isRegistered, "Recipient already registered");
        recipientDetails[id_d_bytes] = Recipient(true, id_d, port, ip_address);
    }

    function registerDataMule() external {
        require(!dataMules[msg.sender].isRegistered, "DataMule already registered");
        dataMules[msg.sender].isRegistered = true;
    }


    event SignatureVerified(address indexed signer, string publicKey);
    event MessageSent(string indexed recipientId, string ip_address, string port, bytes32 _ethSignedMessageHash);


    function forwardMessage(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public  {
        require(dataMules[msg.sender].isRegistered, "Only Data Mules can forward messages");
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        address signer = ecrecover(_ethSignedMessageHash, v, r, s);

        string memory publicKey = getPublicKeyForSigner(signer);
        emit SignatureVerified(signer, publicKey);

        if (usersByAddress[signer].isRegistered) {
            dataMules[msg.sender].accumulatedTokens += 1;
        }
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {

        // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
        // second 32 bytes
            s := mload(add(sig, 64))
        // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

    }


    function getPublicKeyForSigner(
        address signer
    ) public view returns (string memory) {

        require(usersByAddress[signer].isRegistered, "Signer is not a registered user");

        return usersByAddress[signer].publicKey;
    }

    function sendMessage(bytes32 _ethSignedMessageHash, string memory recipientId) public {

        bytes32 recipientId_bytes = keccak256(abi.encodePacked(recipientId));

        require(recipientDetails[recipientId_bytes].isRegistered, "Recipient not registered");

        string memory ip_address = recipientDetails[recipientId_bytes].ip_address;
        string memory port = recipientDetails[recipientId_bytes].port;

        emit MessageSent(recipientId, ip_address, port, _ethSignedMessageHash);

    }
}
