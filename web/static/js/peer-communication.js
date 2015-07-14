/*jshint esnext: true*/

import {Socket} from "phoenix";

export var PeerCommunicationEvent = {
    Connected: "connected-broker",
    Data: "peer-data-received",
    PeerConnected: "peer-connected"
};

export class PeerCommunicationProtocol extends EventEmitter {
    constructor(initiator, onDataReceived, onConnected, onRTCConnected) {
        super();

        this.id = null;
        this.initiator = initiator;
        this.peers = {};
        this.onDataReceivedExternal = onDataReceived;
        this.onConnectedExternal = onConnected;
        this.onRTCConnectedExternal = onRTCConnected;

        let socket = new Socket("/ws", {
            logger: (kind, msg, data) => {console.log(`${kind}: ${msg}`, data);}
        });

        socket.connect();

        socket.onClose(e => console.log("CLOSE", e));

        this.chan = socket.chan("broker:match", {});

        this.chan.join().receive("ok", this.onWSJoined.bind(this))
            .after(1000, () => console.log("Connection interuption"));

        this.chan.onError(this.onWSError.bind(this));
        this.chan.onClose(this.onWSClose.bind(this));
    }

    addEventListener(event, callback) {
        this.on(event, callback);
        return this;
    }

    removeEventListener(event, callback) {
        this.removeListener(event, callback);
        return this;
    }

    createRTCPeer(initiator, peer_id) {
        return new RTCCommunication(
            initiator,
            (o) => { this.onRTCOfferCreated(peer_id, o);},
            (a) => { this.onRTCAnswerCreated(peer_id, a);},
            (d) => { this.onRTCDataReceived(peer_id, d);},
            (c) => { this.onRTCConnected(peer_id, c);});
    }

    onWSJoined() {
        console.log("WS: Joined");

        this.chan.on("registered", this.onWSRegistered.bind(this));
        this.chan.push("register", {});
    }

    /* Web socket communication */
    onWSError(event) {
        console.log("WS: Error", event);
    }

    onWSClose(event) {
        console.log("WS: Close", event);
    }

    onWSRegistered(msg) {
        console.log("WS: Registered", msg);
        this.id = msg.id;
        this.chan.on("peer_connect", this.onWSPeerConnect.bind(this));
        this.chan.on("offer", this.onWSOffer.bind(this));
        this.chan.on("answer", this.onWSAnswer.bind(this));

        this.emit(PeerCommunicationEvent.Connected, this);

        if(this.onConnectedExternal) {
            this.onConnectedExternal(this);
        }
    }

    onWSPeerConnect(msg) {
        console.log("WS: Peer Connection", msg);
        this.peers[msg.peer_id] = this.createRTCPeer(this.initiator, msg.peer_id);
    }

    onWSOffer(msg) {
        console.log("WS: Got Offer", msg);
        this.peers[msg.peer_id].signal(msg.offer);
    }

    onWSAnswer(msg) {
        console.log("WS: Got Answer", msg);
        this.peers[msg.peer_id].signal(msg.answer);
    }

    /* RTC communication */
    onRTCOfferCreated(peer_id, offer) {
        console.log(`RTC: Offer created ${peer_id}`, offer);
        this.chan.push("offer", {offer: offer, peer_id: peer_id, sender_id: this.id});
    }

    onRTCAnswerCreated(peer_id, answer) {
        console.log(`RTC: Answer created ${peer_id}`, answer);
        this.chan.push("answer", {answer: answer, peer_id: peer_id, sender_id: this.id});
    }

    onRTCDataReceived(peer_id, data) {
        console.log(`RTC: Data received ${peer_id}`);

        this.emit(PeerCommunicationEvent.Data, {peer_id: peer_id, data: data});

        if(this.onDataReceivedExternal) {
            this.onDataReceivedExternal(peer_id, data);
        }
    }

    onRTCConnected(peer_id, rtcClient) {
        console.log(`RTC: Connected ${peer_id}`);

        this.emit(PeerCommunicationEvent.PeerConnected, {peer_id: peer_id, peer_comm: this});

        if(this.onRTCConnectedExternal) {
            this.onRTCConnectedExternal(rtcClient);
        }
    }

    /* Other functions */
    connect(peer_id) {
        this.peers[peer_id] = this.createRTCPeer(this.initiator, peer_id);
        this.chan.push("connect", {peer_id: peer_id, sender_id: this.id});
    }

    send(peer_id, data) {
        this.peers[peer_id].send(data);
    }

    sendToAllConnectedPeers(data) {
        for(let peer_id in this.peers) {
            if(this.peers[peer_id] && this.peers[peer_id].isConnected) {
                this.peers[peer_id].send(data);
            }
        }
    }
};

export class RTCCommunication {
    constructor(initiator, onOfferCreated, onAnswerCreated, onDataReceived, onRTCConnected) {
        this.peer = new window.SimplePeer({initiator: initiator, trickle: false});
        this.initiator = initiator;
        this.onOfferCreated = onOfferCreated;
        this.onAnswerCreated = onAnswerCreated;
        this.onDataReceived = onDataReceived;
        this.onRTCConnected = onRTCConnected;
        this.isConnected = false;

        this.peer.on('error', this.onError.bind(this));
        this.peer.on('signal', this.onSignal.bind(this));
        this.peer.on('connect', this.onConnect.bind(this));
        this.peer.on('data', this.onData.bind(this));
    }

    send(data) {
        this.peer.send(data);
    }

    signal(data) {
        this.peer.signal(data);
    }

    onError(error) {
        console.log("RTC: Error", error);
    }

    onSignal(data) {
        console.log("RTC: Data", data);
        if(this.initiator) {
            this.offer = data;
            if(this.onOfferCreated) {
                this.onOfferCreated(this.offer);
            }
        }
        else {
            this.answer = data;
            if(this.onAnswerCreated) {
                this.onAnswerCreated(this.answer);
            }
        }
    }

    onConnect() {
        console.log("RTC: Connected");
        this.isConnected = true;
        if(this.onRTCConnected) {
            this.onRTCConnected(this);
        }
    }

    onData(data) {
        console.log("RTC: Data received");
        if(this.onDataReceived) {
            this.onDataReceived(data);
        }
    }
};
