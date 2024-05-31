import React, { useEffect, useRef, useState } from 'react';

// Import necessary components from Ant Design library
import { Button, Typography, Input } from 'antd';
const { Title, Paragraph } = Typography;
const { TextArea } = Input;

// Import helper functions for WebRTC connections
import { sendWsMessage, setupDevice, callOnClick, onAnswer } from './HelperFunctions/RTCConnections';

// Define the Web Sockets URL
const URL_WEB_SOCKET = 'ws://localhost:8090/ws';

function App() {

    const ws = useRef(null); // Create a ref to hold the WebSocket instance
    const [userId, setUserId] = useState('123456');
    const [channelName, setChannelName] = useState('testChannel');

    // useEffect hook to handle WebSocket setup and cleanup
    useEffect(() => {
        const wsClient = new WebSocket(URL_WEB_SOCKET); // create a new web-socket connection
        
        // event handler for WebSocket open event
        wsClient.onopen = () => {
            console.log('1. WS connection opened');
            ws.current = wsClient; // Store WebSocket instance in ref
            
            setupDevice(); // Setup device (e.g., camera, audio)
        };

        // Event handler for WebSocket close event
        wsClient.onclose = () => {
            console.log('WS connection closed');
        };

        // Event handler for WebSocket message event
        wsClient.onmessage = (message) => {
            console.log('WS message received', message.data);
            const parsedMessage = JSON.parse(message.data); // parse the received message
            console.log(parsedMessage.type);
            
            // handle different message types
            switch (parsedMessage.type) {
                case 'offer_sdp_received': {
                    const offer = parsedMessage.body;
                    onAnswer(offer);
                    break;
                }
                case 'answer_sdp_received': {
                    gotRemoteDescription(parsedMessage.body);
                    break;
                }
                default:
                    break;
            }
        };

        // Cleanup function to close WebSocket connection
        return () => {
            wsClient.close();
        };

    }, []);

    const handleCallClick = () => {
        callOnClick(userId, channelName, ws.current);
    };

    const handleSendWsMessage = () => {
        const messageBody = { userId, channelName, message: 'Test Message' };
        sendWsMessage('send_message', messageBody, ws.current);
    };

    // Function to send a message via WebSocket
    // const sendWsMessage = (type, body) => {
    //     console.log('sendWsMessage invoked', type, body);
    //     ws.current.send(JSON.stringify({
    //         type,
    //         body,
    //     }));
    // };

    // Main render function of the App component
    return (
        <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <div className="App-header" style={{ textAlign: 'center', width: '80%' }}>
                <Title>WebRTC</Title>
                <Paragraph>This is a simple demo app that demonstrates how to build a WebRTC application from scratch, including a signaling server.</Paragraph>
                <div className='wrapper-row' style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                    <div className="wrapper">
                        <Input
                            placeholder="User ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            style={{ width: 240, marginTop: 16 }}
                        />
                        <Input
                            placeholder="Channel Name"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            style={{ width: 240, marginTop: 16 }}
                        />
                        <Button
                            style={{ width: 240, marginTop: 16 }}
                            type="primary"
                            onClick={handleCallClick}
                        >
                            Call
                        </Button>
                        <Button
                            danger
                            style={{ width: 240, marginTop: 16 }}
                            type="primary"
                        >
                            Hangup
                        </Button>
                    </div>
                    <div className="wrapper">
                        <TextArea
                            style={{ width: 240, marginTop: 16 }}
                            placeholder='Send message'
                        />
                        <TextArea
                            style={{ width: 240, marginTop: 16 }}
                            placeholder='Receive message'
                            disabled
                        />
                        <Button
                            style={{ width: 240, marginTop: 16 }}
                            type="primary"
                            onClick={handleSendWsMessage}
                        >
                            Send Message
                        </Button>
                    </div>
                </div>
                <div className='playerContainer' id="playerContainer" style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <p>This is the peer (Subscriber) player</p>
                    <video id="peerPlayer" autoPlay style={{ width: 640, height: 480, marginRight: 16 }} />
                    <p>This is the local (Streamer) player</p>
                    <video id="localPlayer" autoPlay style={{ width: 640, height: 480 }} />
                </div>
            </div>
        </div>
    );
}

export default App;
