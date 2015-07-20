/*jshint esnext: true*/

import {PeerCommunicationEvent, PeerCommunicationProtocol} from "./peercommunication";

let FILE_TRANSFER_PROGRESS = "file_transfer_progress";

export class FileTransferReceiver extends EventEmitter {
    constructor(peerComm, peer_id, fileInfo, receiverId) {
        super();
        this.fileTransferCompleteEvent = "file_transfer_complete";

        this.peerComm = peerComm;
        this.receiverId = receiverId;
        this.peer_id = peer_id;
        this.fileInfo = fileInfo;
        this.id = this.generateId();
        this.receivedBuffer = [];
    }

    download() {
        // Change the file name as identifier to some id
        this.peerComm.send(this.peer_id, {type: "download", data: {
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

        console.log(`Processing file chunk ${transfer_id}, ${chunkNum}/${totalChunks}, length: ${data.length}`);
        this.receivedBuffer.push(this.str2ab(data));

        this.emit(FILE_TRANSFER_PROGRESS, {chunk: chunkNum+1, total: totalChunks, correlationId: this.receiverId});

        if(chunkNum === totalChunks-1) {
            let receivedFile = new window.Blob(this.receivedBuffer);
            this.emit(this.fileTransferCompleteEvent, {file: this.fileInfo, blob: receivedFile, correlationId: this.receiverId});
        }
    }

    addOnProgressListener(callback) {
        this.on(FILE_TRANSFER_PROGRESS, callback);
    }

    removeOnProgressListener(callback) {
        this.removeListener(FILE_TRANSFER_PROGRESS, callback);
    }

    addOnCompleteListener(callback) {
        this.on(this.fileTransferCompleteEvent, callback);
    }

    removeOnCompleteListener(callback) {
        this.removeListener(this.fileTransferCompleteEvent, callback);
    }

    str2ab(str) {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    generateId() {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(let i=0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}
