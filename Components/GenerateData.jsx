import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EthCrypto from 'eth-crypto'
import "@/Components/home.css"
import Image from "next/image";
import images from "@/assets";
const GenerateData = ({ contract }) => {
    const [userPrivateKey, setUserPrivateKey] = useState('');
    const [userPublicKey, setUserPublicKey] = useState('');
    const [recipientPublicKey, setRecipientPublicKey] = useState('');
    const [msg, setMsg] = useState('');
    const [msgSignature, setMsgSignature] = useState('');
    const [messageHash, setMessageHash] = useState('');
    const [message, setMessage] = useState('');
    const [recipientIdAddress, setRecipientIdAddress] = useState('');
    const [isCreated, setIsCreated] = useState(false);

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleFileUserUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lines = content.split('\n');
                const publicKey = lines[0].split('PublicKey: ')[1].trim();
                const privateKey = lines[1].split('PrivateKey: ')[1].trim();
                setUserPrivateKey(privateKey);
                setUserPublicKey(publicKey);
            };
            reader.readAsText(file);
        }
    };

    const handleFileRecipientUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lines = content.split('\n');
                const publicKey = lines[0].split('PublicKey: ')[1].trim();
                setRecipientPublicKey(publicKey)
            };
            reader.readAsText(file);
        }
    };

    const generateAndSaveData = async () => {
        setIsCreated(false);
        try {
            const cyphData = await EthCrypto.encryptWithPublicKey(recipientPublicKey, message);

            const msg = {
                senderPublicKey: userPublicKey,
                recipientId: recipientIdAddress,
                cyphData: cyphData,
            };

            // setMsg(msg);

            const signature = EthCrypto.sign(userPrivateKey, EthCrypto.hash.keccak256(JSON.stringify(msg)));

            const signedMessage = {
                msg: msg,
                signature: signature,
            };

            setMsgSignature(JSON.stringify(signedMessage));

            sessionStorage.setItem("signedMessage", JSON.stringify(signedMessage));
            setIsCreated(true);
            return signedMessage;
        }catch (e) {
            console.error(e);
        }
    };

    const verifySignature = async () => {

        try {

            const { msg, signature } = JSON.parse(msgSignature);

            const isSignatureValid = EthCrypto.recoverPublicKey(
                signature, // Address derived from public key
                EthCrypto.hash.keccak256(JSON.stringify(msg)),
            );

            console.log(isSignatureValid);
            return isSignatureValid;
        } catch (error) {
            console.error('Error verifying signature:', error);
        }
    };

    const verifySignatureContract = async () => {
        try {
            const { msg, signature } = JSON.parse(msgSignature);
            const messageHash = EthCrypto.hash.keccak256(JSON.stringify(msg));
            console.log("messageHash: " + messageHash);
            console.log("signature: " + signature);
            const recoveredAddress = await contract.forwardMessage(messageHash, signature);
            // const recoveredAddress = ethers.recoverAddress(messageHash, signature);
            console.log(recoveredAddress);
        } catch (e) {
            console.log(e);
        }

    }


    return (
        <div>
            <h1>Genera Dati Casuali</h1>
            <div>
                <div>
                    <h3>Inserisci le chiavi utente:</h3>
                    <input className="button-style" type="file" onChange={handleFileUserUpload} />
                </div>
                <div style={{paddingBottom: '40px'}}>
                    <h3>Inserisci le chiavi Recipient:</h3>
                    <input className="button-style" type="file" onChange={handleFileRecipientUpload} />
                </div>
            </div>
            <div>
                <label>Messaggio: </label>
                <input className="input-style"  placeholder="inserisci messaggio" type="text" value={message} onChange={handleMessageChange} />
            </div>
            <div>
                <label>Id Recipient: </label>
                <input
                    className="input-style"
                    type="text"
                    placeholder="ID del Destinatario"
                    value={recipientIdAddress}
                    onChange={(e) => setRecipientIdAddress(e.target.value)}
                />
            </div>

            <div style={{paddingTop: '20px'}}>
                <button className="button-style" onClick={generateAndSaveData}>Cripta e Firma</button>
                {/*<button onClick={verifySignature}>Verifica Firma</button>*/}
                {/*<button onClick={verifySignatureContract}>Verifica CONTRATTO</button>*/}
                {isCreated && <Image src={images.success} alt="correct" width={30} height={30} style={imageStyle}/>}
            </div>
        </div>
    );
}

const imageStyle = {
    paddingLeft: '20px',
}


export default GenerateData;