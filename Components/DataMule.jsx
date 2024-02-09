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

    // const messageSentEvent = contract.filters.MessageSent();

    useEffect(() => {
        // Recupera i dati dalla sessionStorage
        const storedSignedMessage = sessionStorage.getItem('signedMessage');
        if (storedSignedMessage) {
            setSignedMessage(storedSignedMessage);
        }
        // Aggiorna il numero dei token accumulati inizialmente
        updateAccumulatedTokens();
    }, []);


    useEffect(() => {
        const checkForVerify = async () => {
            contract.on("SignatureVerified", async (signer, publicKey) => {
                console.log(`La firma per l'indirizzo ${signer} è stata verificata con successo con la chiave pubblica ${publicKey}`);
                setIsSignatureVerified(true);
                // Aggiorna il numero dei token accumulati
                updateAccumulatedTokens();
            });

            return () => {
                contract.off("SignatureVerified");
            };
        }
        checkForVerify();
    }, [contract]);



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
            // setAccumulatedTokens(dataMule.accumulatedTokens.toNumber());
        }catch (e) {
            console.log(e);
        }
    };

    const verifyAndForwardMessage = async () => {
        setIsMessageSent(false);
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
            // await messageSended.wait();
            setIsLoading(false);
            setIsMessageSent(true);

            console.log(messageSended);

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
