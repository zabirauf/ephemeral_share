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
        this.notifyUpdatedFiles(this.files);
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

export class FileTransferManager extends EventEmitter {
    constructor(peerComm, fileInfoStore) {
        super();

        this.peerComm = peerComm;
        this.fileInfoStore = fileInfoStore;
        this.files = [];
        this.peerComm.addEventListener(PeerCommunicationEvent.Data, this.onPeerDataReceived.bind(this));
        this.fileInfoStore.addChangeListener(this.onFilesUpdated.bind(this));
    }

    onPeerDataReceived({peer_id: peer_id, data: data}) {
        let {type: type, data: payload} = data;
        if(type === "download") {
            this.startFileTransfer(peer_id, payload);
        }
    }

    onFilesUpdated(files) {
        this.files = files;
    }

    startFileTransfer(peer_id, {name: name, transfer_id: id}) {
        let file = this.files.filter((f) => f.name === name);
        if(file && file.length > 0) {
            // Take the first file
            file = file[0];

            new FileTransferSender(this.peerComm, peer_id, file, id).transfer();
        }
    }

    downloadFile(peer_id, file, callback) {
        let downloader = new FileTransferReceiver(this.peerComm, peer_id, file);
        downloader.addOnCompleteListener(callback);
        downloader.download();
    }
}

class FileTransferReceiver extends EventEmitter {
    constructor(peerComm, peer_id, fileInfo) {
        super();
        this.fileTransferCompleteEvent = "file_transfer_complete";

        this.peerComm = peerComm;
        this.peer_id = peer_id;
        this.fileInfo = fileInfo;
        this.id = this.generateId();
        this.receivedBuffer = [];
    }

    download() {
        // Change the file name as identifier to some id
        this.peerComm.send(this.peer_id, {type: "donwload", data: {
            name: this.fileInfo.name,
            transfer_id: this.id
        }});

        this.peerComm.addEventListener(PeerCommunicationEvent.Data, this.onPeerDataReceived.bind(this));
    }

    onPeerDataReceived({peer_id: peer_id, data: data}) {

        if(data.type === "file_chunk" && peer_id === this.peer_id && data.data.transfer_id && data.data.transfer_id == this.id) {
            this.processFileChunk(data.data);
        }
    }

    processFileChunk({transfer_id: transfer_id, chunkNumber: chunkNum, totalChunks: totalChunks, data: data}) {

        this.receivedBuffer.push(data);
        if(chunkNumber === totalChunks-1) {
            let receivedFile = new window.Blob(this.receivedBuffer);
            this.emit(this.fileTransferCompleteEvent, {file: this.fileInfo, blob: receivedFile});
        }
    }

    addOnCompleteListener(callback) {
        this.on(this.fileTransferCompleteEvent, callback);
    }

    removeOnCompleteListener(callback) {
        this.removeListener(this.fileTransferCompleteEvent, callback);
    }

    generateId() {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(let i=0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}

class FileTransferSender extends EventEmitter {
    constructor(peerComm, peer_id, file, id) {
        super();
        this.chunkSize = 128 * 1024;

        this.peerComm = peerComm;
        this.peer_id = peer_id;
        this.file = file;
        this.id = id;
        this.numberOfChunks = Math.ceil(this.file.size/this.chunkSize);
        this.chunkNum = 0;
    }

    transfer() {
        (() => this.transferChunk())();
    }

    transferChunk() {
        if(this.chunkNum >= this.numberOfChunks) {
            return;
        }

        let startByte = this.chunkSize * this.chunkNum;
        let chunk = this.file.slice(startByte, startByte + this.chunkSize);

        let reader = new FileReader();

        reader.onload(this.sendReadChunkAndContinue.bind(this));

        reader.readAsArrayBuffer(chunk);
    }

    sendReadChunkAndContinue(event) {
        let buffer = event.target.result;

        this.peerComm.send(this.peer_id, {type: "file_chunk", data: {
            transfer_id: this.id,
            chunkNumber: this.chunkNum,
            totalChunks: this.numberOfChunks,
            data: buffer
        }});

        // Incrementing chunk number
        this.chunkNum += 1;

        // Send next chunk
        this.transfer();
    }
}
