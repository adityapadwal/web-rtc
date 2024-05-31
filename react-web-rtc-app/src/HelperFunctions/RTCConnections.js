// ******* Step 1: Setting up the local media stream (camera and microphone). *********

// Variable to hold the media stream (audio and video) from the user's device.
let localStream;
let localPeerConnection;

// Function to request access to the user's camera and microphone.
export const setupDevice = () => {
    console.log('2. setupDevice function invoked'); // Log function invocation for debugging purposes

    // Media constraints object specifies the desired properties of the media stream
    const constraints = {
        video: {
            width: { ideal: 1280 }, // Desired width in pixels
            height: { ideal: 720 }, // Desired height in pixels
            frameRate: { ideal: 30 }, // Desired frame rate in frames per second
        },
        audio: true, // Request audio
    };

    // request access to the user's media devices using promises
    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            // Render local stream on DOM
            const localPlayer = document.getElementById('localPlayer'); // Get the video element by its ID
            localPlayer.srcObject = stream; // Set the video element's source to the local stream
            localStream = stream; // Store the local stream in the global variable

            console.log('3. Media stream acquired:', stream); // Log the acquired stream
        })
        .catch((error) => {
            console.error('getUserMedia error:', error); // Log any errors that occur
        });
};

// ******** Step 2: Establishing the RTCPeerConnection. ********

// Configuration for RTCPeerConnection (this is just a placeholder, you should configure your ICE servers here)
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Example of a STUN server
    ]
};

// Peer connection constraints (optional, used for advanced configurations)
const pcConstraints = {
    'optional': [
        { 'DtlsSrtpKeyAgreement': true }, // Enable DTLS-SRTP key agreement
    ],
};

// When the user clicks the call button, create the peer-to-peer connection
 export const callOnClick = (userId, channelName, ws) => {
    console.log('4. callOnClick invoked'); // Log function invocation for debugging purposes

    // Check if there are video tracks in the local stream
    if (localStream.getVideoTracks().length > 0) {
        console.log(`5. Using video device: ${localStream.getVideoTracks()[0].label}`); // Log the video device label
    }

    // Check if there are audio tracks in the local stream
    if (localStream.getAudioTracks().length > 0) {
        console.log(`6. Using audio device: ${localStream.getAudioTracks()[0].label}`); // Log the audio device label
    }

    // Create a new RTCPeerConnection with the specified servers and constraints
    localPeerConnection = new RTCPeerConnection(servers, pcConstraints);
    
    // Set up event handlers for ICE candidates and stream addition
    localPeerConnection.onicecandidate = (event) => gotLocalIceCandidateOffer(event, userId, channelName, ws);
    localPeerConnection.onaddstream = gotRemoteStream;

    // Add the local stream to the peer connection
    localPeerConnection.addStream(localStream);

    // Create an offer SDP (Session Description Protocol) to initiate the connection

    localPeerConnection.createOffer()
        .then((offer) => gotLocalDescription(offer, ws, channelName, userId))
        .catch((error) => console.error('Error creating offer:', error));
};

// Function to handle the local SDP (offer) generated by the createOffer method
const gotLocalDescription = (offer, ws, channelName, userId) => {
    console.log('gotLocalDescription invoked:', offer); // Log the generated offer SDP
    localPeerConnection.setLocalDescription(offer); // Set the local description for the peer connection
    sendWsMessage('send_offer', { channelName, userId, sdp: offer }, ws);
};

// Function to handle the remote stream when it's received
const gotRemoteStream = (event) => {
    console.log('gotRemoteStream invoked', event.stream); // Log function invocation for debugging purposes
    const remotePlayer = document.getElementById('peerPlayer'); // Get the remote video element by its ID
    remotePlayer.srcObject = event.stream; // Set the remote video element's source to the received stream
};

// Function to handle ICE candidates
const gotLocalIceCandidateOffer = (event, userId, channelName, ws) => {
    console.log('gotLocalIceCandidateOffer invoked', event.candidate, localPeerConnection.localDescription); // Log the ICE candidate event

    // Check if the ICE candidate gathering is complete
    if (!event.candidate) {
        const offer = localPeerConnection.localDescription; // Get the local description (SDP offer)

        // Send the offer SDP to the signaling server via WebSocket
        sendWsMessage('send_offer', {
            channelName, // Channel name for the signaling server
            userId, // User ID for the signaling server
            sdp: offer, // The SDP offer to be sent
        }, ws);
    }
};

// Placeholder variables for signaling (these should be set appropriately in your application)
const channelName = 'testChannel';
const userId = '123456';

export const onAnswer = (message) => {
    console.log('onAnswer invoked with message ', message);
    const answer = message.sdp; // Ensure correct access to the SDP data

    // Create a new RTCSessionDescription object with the offer
    const rtcSessionDescription = new RTCSessionDescription(offer);

    // Set the remote description using the RTCSessionDescription object
    localPeerConnection.setRemoteDescription(new rtcSessionDescription(answer))
        .then(() => localPeerConnection.createAnswer())
        .then((answer) => gotAnswerDescription(answer))
        .catch((error) => console.error('Error setting remote description or creating answer:', error));
};

const gotAnswerDescription = (answer) => {
    console.log('gotAnswerDescription invoked:', answer);
    localPeerConnection.setLocalDescription(answer);
};

const gotLocalIceCandidateAnswer = (event, userId, channelName, ws) => {
    console.log('gotLocalIceCandidateAnswer invoked', event.candidate, localPeerConnection.localDescription);
    // gathering candidate finished, send complete sdp
    if (!event.candidate) {
        const answer = localPeerConnection.localDescription;
        sendWsMessage('send_answer', {
            channelName,
            userId,
            sdp: answer,
        }, ws);
     }
 };

 export const sendWsMessage = (type, body, ws) => {
    console.log('sendWsMessage invoked', type, body);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, body }));
    }
};