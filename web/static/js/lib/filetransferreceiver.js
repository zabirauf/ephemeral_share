/*jshint esnext: true*/

import {PeerCommunicationEvent, PeerCommunicationProtocol} from "./peer-communication";

export class FileTransferReceiver extends EventEmitter {
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
