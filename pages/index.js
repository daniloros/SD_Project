import React, {useEffect, useState} from 'react';
import { ethers } from 'ethers';
import Web3Modal from "web3modal";
import {contractABI, contractAddress} from "@/Context/constants";
import GenerateData from "@/Components/GenerateData";
const EthCrypto = require('eth-crypto');
import "@/Components/home.css";
import {DataMule} from "@/Components";
import { createRoot } from 'react-dom/client';
import { ClipLoader } from "react-spinners";
import Image from "next/image";
import images from "@/assets";


export const fetchContract = (signerOrProvider) => new ethers.Contract(contractAddress, contractABI, signerOrProvider);
export const connectingWithContract = async () => {
    try {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = fetchContract(signer);

        return contract;
    } catch (error) {
        console.log(error);
    }
}

const HomePage = () => {
    const [contract, setContract] = useState(null);
    const [userIdentity, setUserIdentity] = useState('');
    const [recipientIdentity, setRecipientIdentity] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [recipientIpAddress, setRecipientIpAddress] = useState('');
    const [recipientPort, setRecipientPort] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isUserRegistered, setIsUserRegistered] = useState(false);
    const [isRecipientRegistered, setIsRecipientRegistered] = useState(false);
    const [isDataMuleRegistered, setIsDataMuleRegistered] = useState(false);

    const openModal = () => {
        setShowModal(true);
        setIsUserRegistered(false);
        setIsRecipientRegistered(false);
        setIsDataMuleRegistered(false);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    useEffect(() => {
        const init = async () => {
            const contractInstance = await connectingWithContract();
            setContract(contractInstance);
        };

        init();
    }, []);
    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };


    const generateKeyPairForUser = () => {
        const userIdentity = EthCrypto.createIdentity()
        setUserIdentity(userIdentity);
        console.dir(userIdentity);
        downloadUserKeysFile(userIdentity.publicKey, userIdentity.privateKey, userIdentity.address);
    };


    const generateKeyForRecipient = () => {
        const recipientIdentity = EthCrypto.createIdentity()
        setRecipientIdentity(recipientIdentity);
        console.dir(recipientIdentity);
        downloadRecipientKey(recipientIdentity.publicKey, recipientIdentity.privateKey, recipientIdentity.address);
    };

    const registerUser = async () => {
        console.log("Registrando l'utente con chiave pubblica:", userIdentity.publicKey);
        try{
            const transaction = await contract.registerUser(userIdentity.address, userIdentity.publicKey);
            setIsLoading(true);
            setIsUserRegistered(false);
            await transaction.wait();
            setIsLoading(false);
            setIsUserRegistered(true);
            console.log("Utente registrato con successo.");
        } catch (error) {
            console.error("Errore durante la registrazione:", error);
        }
    };

    const registerRecipient = async () => {
        if (!recipientIdentity.publicKey || !recipientId || !recipientIpAddress || !recipientPort) {
            console.error("Dati del destinatario incompleti");
            return;
        }
        try {
            console.log("Registrando il recipient");
            const transaction = await contract.registerRecipient(recipientIdentity.publicKey, recipientId, recipientPort, recipientIpAddress);
            setIsLoading(true);
            setIsRecipientRegistered(false);
            await transaction.wait();
            setIsLoading(false);
            setIsRecipientRegistered(true);
            console.log("Destinatario registrato con successo.");
        } catch (error) {
            console.error("Errore durante la registrazione del destinatario:", error);
        }
    };

    const registerDataMule = async () => {
        try {
            console.log("Registrando il datamule");
            const transaction = await contract.registerDataMule();
            setIsLoading(true);
            setIsDataMuleRegistered(false);
            await transaction.wait();
            setIsLoading(false);
            setIsDataMuleRegistered(true);
            console.log("Data Mule registrato con successo.");
        } catch (error) {
            console.error("Errore durante la registrazione del Data Mule:", error.message);
        }
    };

    const downloadUserKeysFile = (publicKey, privateKey, address) => {
        const fileContent = `PublicKey: ${publicKey}\nPrivateKey: ${privateKey}\nAddress: ${address}`;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const fileUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = 'UserKey.txt';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(fileUrl);
    };

    const downloadRecipientKey = (publicKey, privateKey,address) => {
        const fileContent = `PublicKey: ${publicKey}\nPrivateKey: ${privateKey}\nAddress: ${address}`;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const fileUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = 'RecipientKey.txt';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(fileUrl);
    };


    const openDataMuleComponent = () => {
        const newWindow = window.open('', '_blank');
        const container = newWindow.document.createElement('div');
        newWindow.document.body.appendChild(container);


        const root = createRoot(container);

        root.render(<DataMule contract={contract} />);
    };

    return (
        <div className="home-page-container">
            {isLoading ? (
                <div className="spinner">
                    <ClipLoader color={"#36D7B7"} loading={isLoading} className="spinner-style" size={150} />
                </div>
            ) : (
                <div className="column principal-div-style">
                    <div>
                        <h1>Registrazione Utente</h1>
                        <div style={{ paddingBottom: '20px' }}>
                            <button className="button-style" onClick={generateKeyPairForUser}>Genera chiavi per utente</button>
                        </div>
                        <div>
                            <button className="button-style" onClick={registerUser}>Registra Utente su SmartContract</button>
                            {isUserRegistered && <Image src={images.success} alt="correct" width={30} height={30} style={imageStyle}/>}
                        </div>
                    </div>
                    <div>
                        <h1>Registrazione Destinatario</h1>
                        <button className="button-style"  onClick={generateKeyForRecipient}>Genera chiavi per destinatario</button>
                    </div>
                    <div>
                        <h1>Registrazione Destinatario</h1>
                        <div>
                            <div>
                                <label>ID del destinatario: </label>
                            <input
                                className="input-style"
                                type="text"
                                placeholder="1"
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                            />
                            </div>
                            <div>
                                <label>Indirizzo IP del destinatario: </label>
                            <input
                                className="input-style"
                                type="text"
                                placeholder="127.0.0.0"
                                value={recipientIpAddress}
                                onChange={(e) => setRecipientIpAddress(e.target.value)}
                            />
                            </div>
                            <div>
                                <label>Porta del destinatario: </label>
                            <input
                                className="input-style"
                                type="text"
                                placeholder="3000"
                                value={recipientPort}
                                onChange={(e) => setRecipientPort(e.target.value)}
                            />
                            </div>
                            <div style={{paddingTop: '20px'}}>
                                <button className="button-style" onClick={registerRecipient}>Registra Destinatario</button>
                                {isRecipientRegistered && <Image src={images.success} alt="correct" width={30} height={30} style={imageStyle}/>}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1>Registrazione DataMule</h1>
                        <div>
                            <button className="button-style" onClick={registerDataMule}>Registra DataMule</button>
                            {isDataMuleRegistered && <Image src={images.success} alt="correct" width={30} height={30} style={imageStyle}/>}
                        </div>
                    </div>
                </div>
            )}
            <div className="column principal-div-style">
                <GenerateData contract={contract} />
            </div>
            <div className="column principal-div-style">
                <div>
                    <h1>Apri DataMule</h1>
                    <button className="button-style" onClick={openModal}>Apri Modale</button>
                    {showModal && (
                        <div className="modal">
                            <div className="modal-content">
                                <span className="close" onClick={closeModal}>&times;</span>
                                <DataMule contract={contract}/>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const imageStyle = {
    paddingLeft: '20px',
}
export default HomePage;