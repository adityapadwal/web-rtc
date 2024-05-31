import React, { useEffect, useRef } from 'react';

import { Button, Typography, Input } from 'antd';
const { Title, Paragraph } = Typography;
const { TextArea } = Input;

import { sendWsMessage, setupDevice, callOnClick, onAnswer } from './HelperFunctions/RTCConnections';

const URL_WEB_SOCKET = 'ws://localhost:8090/ws';

function App() {
    const ws = useRef(null);
    useEffect(() => {
        const wsClient = new WebSocket(URL_WEB_SOCKET);
        wsClient.onopen = () => {
            console.log('ws opened');
            ws.current = wsClient;
            // setup camera and join channel after ws opened
            setupDevice();
        };
        wsClient.onclose = () => console.log('ws closed');
        wsClient.onmessage = (message) => {
            console.log('ws message received', message.data);
            const parsedMessage = JSON.parse(message.data);
            switch (parsedMessage.type) {
                case 'joined': {
                    const body = parsedMessage.body;
                    console.log('users in this channel', body);
                    break;
                }
                case 'offer_sdp_received': {
                    const offer = parsedMessage.body;
                    onAnswer(offer);
                    break;
                }
                case 'answer_sdp_received': {
                    gotRemoteDescription(parsedMessage.body);
                    break;
                }
                case 'quit': {
                    break;
                }
                default:
                    break;
            }
        };
        return () => {
            wsClient.close();
        };

    }, []);

    const sendWsMessage = (type, body) => {
        console.log('sendWsMessage invoked', type, body);
        ws.current.send(JSON.stringify({
            type,
            body,
        }));
    };

    const renderHelper = () => {
        return (
            <div className="wrapper">
                <Input
                    placeholder="User ID"
                    style={{ width: 240, marginTop: 16 }}
                />
                <Input
                    placeholder="Channel Name"
                    style={{ width: 240, marginTop: 16 }}
                />
                <Button
                    style={{ width: 240, marginTop: 16 }}
                    type="primary"
                    onClick={callOnClick}
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
        );
    };

    const renderTextarea = () => {
        return (
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
                // disabled={sendButtonDisabled}
                >
                    Send Message
                </Button>
            </div>
        );
    };

    return (
        <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <div className="App-header" style={{ textAlign: 'center', width: '80%' }}>
                <Title>WebRTC</Title>
                <Paragraph>This is a simple demo app that demonstrates how to build a WebRTC application from scratch, including a signaling server. It serves as a step-by-step guide to help you understand the process of implementing WebRTC in your own projects.</Paragraph>
                <div className='wrapper-row' style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                    {renderHelper()}
                    {renderTextarea()}
                </div>
                <div
                    className='playerContainer'
                    id="playerContainer"
                    style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}
                >
                    <p>This is the peer (Subscriber) player</p>
                    <video
                        id="peerPlayer"
                        autoPlay
                        style={{ width: 640, height: 480, marginRight: 16 }}
                    />
                    <p>This is the local (Streamer) player</p>
                    <video
                        id="localPlayer"
                        autoPlay
                        style={{ width: 640, height: 480 }}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
