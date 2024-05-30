const WebSocket = require('ws');
const debug = require('debug')(`${process.env.APPNAME}:wss`);

let channels = {};

function init(port) {
    debug('ws init invoked, port:', port);
    const wss = new WebSocket.Server({ port });
    wss.on('connection', (socket) => {
        debug('A client has connected!');
        
        socket.on('error', debug);
        socket.on('message', message => onMessage(wss, socket, message));
        socket.on('close', message => onClose(wss, socket, message));
    });
}

function send(wsClient, type, body) {
    // debug('ws send', body);
    wsClient.send(JSON.stringify({
        type,
        body,
    }));
}

function clearClient(wss, socket) {
    // clear client by channel name and user id
    Object.keys(channels).forEach((cname) => {
        Object.keys(channels[cname]).forEach((uid) => {
            if (channels[cname][uid] === socket) {
                delete channels[cname][uid];
            }
        });
    });
}

function onMessage(wss, socket, message) {
    debug(`onMessage ${message}`);
    const parsedMessage = JSON.parse(message);
    const type = parsedMessage.type;
    const body = parsedMessage.body;
    const channelName = body.channelName;
    const userId = body.userId;

    // Your message handling logic here
}

function onClose(wss, socket, message) {
    debug('onClose', message);
    clearClient(wss, socket);
}

module.exports = { init };
