/*jshint esnext: true*/

import {PeerCommunicationEvent, PeerCommunicationProtocol} from "./peer-communication";

import AppDispatcher from "./appdispatcher";

export class FileInfoStore extends EventEmitter {


    constructor(peerComm, isInitiator) {
        super();
        this.UPDATE_FILE_EVENT = "files-updated";

        this.peerComm = peerComm;
        this.isInitiator = isInitiator;
        this.files = [];

        // The initiator only sends data and is not bothered about receiving and reciprocal for the client peers
        if(this.isInitiator) {
            this.peerComm.addEventListener(PeerCommunicationEvent.PeerConnected, this.onPeerConnected.bind(this));
        }
        else {
            this.peerComm.addEventListener(PeerCommunicationEvent.Data, this.onPeerDataReceived.bind(this));
        }
    }

    onPeerConnected({peer_id: peer_id, peer_comm: p}) {
        p.send(peer_id, this.getDataForPeer(this.files));
    }

    onFilesUpdated(files) {
        console.log("Files updated, sending to all peers", files);
        this.files = files;
        this.peerComm.sendToAllConnectedPeers(this.getDataForPeer(files));
    }

    getDataForPeer(files) {
        return {
            type: "files",
            data: files.map(
                (f) => {
                    return {name: f.name, size: f.size};
                }
            )
        };
    }

    onPeerDataReceived({peer_id: peer_id, data: data}) {
        console.log(`Peer Data Received from ${peer_id}`, data);
        if(data.type === "files") {
            this.onPeerFilesReceived(data.data);
        }
    }

    onPeerFilesReceived(files) {
        this.files.splice(0, this.files.length);
        this.files.concat(files);

        this.notifyUpdatedFiles(files);
    }

    notifyUpdatedFiles(files) {
        this.emit(this.UPDATE_FILE_EVENT, files);
    }

    addChangeListener(callback) {
        this.on(this.UPDATE_FILE_EVENT, callback);
    }

    removeChangeListener(callback) {
        this.removeListener(this.UPDATE_FILE_EVENT, callback);
    }
};
