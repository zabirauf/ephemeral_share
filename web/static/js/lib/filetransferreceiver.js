/*jshint esnext: true*/

import {PeerCommunicationProtocol} from "./peercommunication";
import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";

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
        this.receivedBuffer = null;
        this.chunksReceived = 0;
    }

    download() {
        // Change the file name as identifier to some id
        this.peerComm.send(this.peer_id, {type: "download", data: {
            name: this.fileInfo.name,
            transfer_id: this.id
        }});

        this.peerComm.addEventListener(PeerCommunicationConstants.PEER_DATA, this.onPeerDataReceived.bind(this));
    }

    onPeerDataReceived({peer_id: peer_id, data: data}) {

        if(data.type === "file_chunk" && peer_id === this.peer_id && data.data.transfer_id && data.data.transfer_id == this.id) {
            this.processFileChunk(data.data);
        }
    }

    processFileChunk({transfer_id: transfer_id, chunkNumber: chunkNum, totalChunks: totalChunks, data: data}) {

        console.log(`Processing file chunk ${transfer_id}, ${chunkNum}/${totalChunks}, length: ${data.length}`);
        this.addToBuffer(chunkNum, totalChunks, this.str2ab(data));

        this.chunksReceived += 1;

        console.log(`Chunk Received ${this.chunksReceived}`);
        this.emit(FILE_TRANSFER_PROGRESS, {chunk: chunkNum+1, total: totalChunks, correlationId: this.receiverId});

        if(chunkNum === totalChunks-1 && this.allChunksDownloaded()){
            let receivedFile = new window.Blob(this.receivedBuffer);
            this.emit(this.fileTransferCompleteEvent, {file: this.fileInfo, blob: receivedFile, correlationId: this.receiverId});

            // Remove any resources as the download is complete
            this.destructResources();
        }
    }

    destructResources() {
        this.peerComm.removeEventListener(PeerCommunicationConstants.PEER_DATA, this.onPeerDataReceived.bind(this));
        this.receivedBuffer = null;
    }

    allChunksDownloaded() {
        for(let i=this.receivedBuffer-1;i>=0;i--) {
            if(!this.receivedBuffer[i]) {
                return false;
            }
        }

        return true;
    }

    addToBuffer(chunkNumber, totalChunks, data) {
        if(this.receivedBuffer === null) {
            this.receivedBuffer = new Array(totalChunks);
        }

        this.receivedBuffer[chunkNumber] = data;
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
        var buf = new ArrayBuffer(str.length); // 1 bytes for each char
        var bufView = new Uint8Array(buf);
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
