/*jshint esnext: true*/

import {PeerCommunicationProtocol} from "./peercommunication";
import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";
import FileTransferConstants from "../constants/filetransferconstants";

let FILE_TRANSFER_PROGRESS = "file_transfer_progress";

/**
 * A file transfer receiver responsible for receiving data of a particular file
 * from the peer and combine it into a buffer. Once the download is complete
 * it emits the event of file download complete.
 */
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

        this.transferRate = FileTransferConstants.TRANSFER_RATE;
        this.segmentNumberReceived = 0;
    }

    download() {
        // Change the file name as identifier to some id
        this.peerComm.send(this.peer_id, {type: "download", data: {
            name: this.fileInfo.name,
            transfer_id: this.id,
            transfer_rate: this.transferRate
        }});

        this.peerComm.addEventListener(PeerCommunicationConstants.PEER_DATA, this.onPeerDataReceived.bind(this));
    }

    onPeerDataReceived({peer_id: peer_id, data: data}) {

        if(data.type === "file_chunk" && peer_id === this.peer_id && data.data.transfer_id && data.data.transfer_id == this.id) {
            this.processFileChunk(data.data);
        }
    }

    /**
     * Process file chunks and once the donwload is complete emits the necessary event
     */
    processFileChunk({transfer_id: transfer_id, chunkNumber: chunkNum, totalChunks: totalChunks, data: data}) {

        console.log(`Processing file chunk ${transfer_id}, ${chunkNum}/${totalChunks}, length: ${data.length}`);
        this.addToBuffer(chunkNum, totalChunks, this.str2ab(data));

        this.chunksReceived += 1;

        this.sendSegmentAckIfApplicable();

        console.log(`Chunk Received ${this.chunksReceived}`);
        this.emit(FILE_TRANSFER_PROGRESS, {chunk: chunkNum+1, total: totalChunks, correlationId: this.receiverId});

        if(chunkNum === totalChunks-1 && this.allChunksDownloaded()){
            let receivedFile = new window.Blob(this.receivedBuffer);
            this.emit(this.fileTransferCompleteEvent, {file: this.fileInfo, blob: receivedFile, correlationId: this.receiverId});

            // Remove any resources as the download is complete
            this.destructResources();
        }
    }

    /**
     * Send the acknowledgment for the segment being received
     */
    sendSegmentAckIfApplicable() {
        // We check for chunks Received +1 as at the sender side it is one greate
        // TODO: Improve this logic. It is ugly
        if((this.chunksReceived+1) % this.transferRate === 0) {
            this.segmentNumberReceived += 1;

            this.peerComm.send(this.peer_id, {type: "file_segment_ack", data: {
                transfer_id: this.id,
                segment_number: this.segmentNumberReceived
            }});

            console.log(`Segment ACK sent: ${this.segmentNumberReceived}`);
        }
    }

    /**
     * Removes the resources held by this. Should be called after the download is complete
     */
    destructResources() {
        this.peerComm.removeEventListener(PeerCommunicationConstants.PEER_DATA, this.onPeerDataReceived.bind(this));
        this.receivedBuffer = null;
    }

    /**
     * Checks if all the chunks has been downloaded by seeing if any of them is
     * undefined or not
     */
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

    /**
     * Adds a listener for the file transfer progress
     */
    addOnProgressListener(callback) {
        this.on(FILE_TRANSFER_PROGRESS, callback);
    }

    /**
     * Removes listener for the file transfer progress
     */
    removeOnProgressListener(callback) {
        this.removeListener(FILE_TRANSFER_PROGRESS, callback);
    }

    /**
     * Adds a listener for the file transfer complete
     */
    addOnCompleteListener(callback) {
        this.on(this.fileTransferCompleteEvent, callback);
    }

    /**
     * Removes listener for the file transfer complete
     */
    removeOnCompleteListener(callback) {
        this.removeListener(this.fileTransferCompleteEvent, callback);
    }

    /**
     * Converts the encoded string received from peer to array buffer
     */
    str2ab(str) {
        var buf = new ArrayBuffer(str.length); // 1 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    /**
     * Generates a random identifier
     */
    generateId() {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(let i=0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}
