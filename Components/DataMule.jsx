// DataMule.js
import React, { useEffect, useState } from 'react';
import EthCrypto from "eth-crypto";
import { ClipLoader } from "react-spinners";
import "@/Components/home.css"
import Image from "next/image";
import images from "@/assets";

const DataMule = ({ contract }) => {
    const [signedMessage, setSignedMessage] = useState(null);
    const [accumulatedTokens, setAccumulatedTokens] = useState(0);
    const [isSignatureVerified, setIsSignatureVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setisVerified] = useState(false);
    const [isMessageSent, setIsMessageSent] = useState(false);


    const signatureVerifiedEvent = contract.filters.SignatureVerified();
    const messageSentEvent = contract.filters.MessageSent();



    useEffect(() => {
        // Recupera i dati dalla sessionStorage
        const storedSignedMessage = sessionStorage.getItem('signedMessage');
        console.dir(storedSignedMessage);
        if (storedSignedMessage) {
            setSignedMessage(storedSignedMessage);
        }
        // Aggiorna il numero dei token accumulati inizialmente
        updateAccumulatedTokens();
    }, []);

    useEffect(() => {
        // Sottoscrivi all'evento SignatureVerified per aggiornare il numero dei token accumulati
        const updateTokensOnEvent = (event) => {
            const signer = event.args[0];
            const publicKey = event.args[1];
            console.log(`La firma per l'indirizzo ${signer} è stata verificata con successo con la chiave pubblica ${publicKey}`);

            setIsSignatureVerified(true);
            // Aggiorna il numero dei token accumulati
            updateAccumulatedTokens();
        };

        contract.on(signatureVerifiedEvent, updateTokensOnEvent);

        // Cleanup dell'evento al momento della disconnessione o del component unmounting
        return () => {
            contract.off(signatureVerifiedEvent, updateTokensOnEvent);
        };
    }, [contract, signatureVerifiedEvent]);


    // Aggiorna il numero dei token accumulati quando il valore cambia
    const updateAccumulatedTokens = async () => {
        try {
            const dataMuleAddress = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const dataMule = await contract.dataMules(dataMuleAddress[0]);
            if (dataMule && dataMule.accumulatedTokens !== undefined) {
                setAccumulatedTokens(dataMule.accumulatedTokens);
            } else {
                console.error('Field accumulatedTokens is undefined or not present in dataMule.');
            }
            console.log(dataMule);
            // setAccumulatedTokens(dataMule.accumulatedTokens.toNumber());
        }catch (e) {
            console.log(e);
        }

    };


    const verifyAndForwardMessage = async () => {
        try {
            const { msg, signature } = JSON.parse(signedMessage);
            console.log(msg);
            const messageHash = EthCrypto.hash.keccak256(JSON.stringify(msg));
            console.log("messageHash: " + messageHash);
            console.log("signature: " + signature);
            setisVerified(false);
            setIsLoading(true);
            const recoveredAddress = await contract.forwardMessage(messageHash, signature);
            await  recoveredAddress.wait();
            setIsLoading(false);
            setisVerified(true);
            console.log(recoveredAddress);
            console.log(msg.senderPublicKey);

        } catch (error) {
            console.error('Error verifying signature:', error);
        }
    };

    const sendMessageToForward = async () => {

        try {
            const { msg, signature } = JSON.parse(signedMessage);
            const messageHash = EthCrypto.hash.keccak256(JSON.stringify(msg));
            setIsLoading(true);
            setIsMessageSent(false);
            const messageSended = await contract.sendMessage(messageHash, msg.recipientId);
            await messageSended.wait();
            setIsLoading(false);
            setIsMessageSent(true);

            const sendMessageOnEvent = (event) => {
                const ip_port = event.args[1];
                const port = event.args[2];
                console.log(`Messaggio inviato al seguente indirizzo: ${ip_port} : ${port}`);
            };

            contract.on(messageSentEvent, sendMessageOnEvent);

            // Cleanup dell'evento al momento della disconnessione o del component unmounting
            return () => {
                contract.off(messageSentEvent, sendMessageOnEvent);
            };
        } catch (e) {
            console.log(e.message)
        }
    };

    if(isLoading){
        return (
        <div className="spinner">
            <ClipLoader color={"#36D7B7"} loading={isLoading} className="spinner-style" size={150} />
        </div>
        );
    } else
        return (
        <div>
            <h1>DataMule Component</h1>
            <p>Accumulated Tokens: {accumulatedTokens.toString()}</p>
            <div style={{paddingBottom: '20px'}}>
                <button className="button-style" onClick={verifyAndForwardMessage}>Verifica e Inoltra Messaggio</button>
                {isVerified && <Image src={images.success} alt="correct" width={30} height={30} style={imageStyle}/>}
            </div>
            <div>
                <button className="button-style" onClick={sendMessageToForward} disabled={!isSignatureVerified}>Manda il messaggio</button>
                {isMessageSent && <Image src={images.success} alt="correct" width={30} height={30} style={imageStyle}/>}
            </div>
        </div>
    );
};

const imageStyle = {
    paddingLeft: '20px',
}

export default DataMule;
