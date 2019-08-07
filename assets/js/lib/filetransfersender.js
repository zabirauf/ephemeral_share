/*jshint esnext: true*/

import EventEmitter from "events";
import { PeerCommunicationProtocol } from "./peercommunication";
import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";

let FILE_TRANSFER_UPLOAD_PROGRESS = "file_transfer_upload_progress";
let FILE_TRANSFER_UPLOAD_COMPLETE = "file_transfer_upload_complete";

/**
 * The file sender, which slices up the file and sends it to the peer
 */
export class FileTransferSender extends EventEmitter {
  constructor(peerComm, peer_id, file, id, correlationId, transferRate) {
    super();
    this.chunkSize = 16 * 1024;

    this.peerComm = peerComm;
    this.peer_id = peer_id;
    this.file = file;
    this.id = id;
    this.correlationId = correlationId;
    this.transferRate = transferRate;

    this.numberOfChunks = Math.ceil(this.file.size / this.chunkSize);
    this.chunkNum = 0;

    /**
     * For controlling rate of transfer, the file upload is divided into segments which is
     * a group of chunks e.g 10 chunks can be one segment. At sending the segment the sender
     * will stop to send any more segments and after receiver acknowledges receiving the segment
     * the sender will resume sending again.
     * This approach can later be used to add the feature to resume and pause download as well
     */

    // The segment number tells which segment is being uploaded
    this.segmentNumberSending = 1;
    this.totalSegments = Math.ceil(this.numberOfChunks / transferRate);

    this.canWaitForAck = false;
    this.peerComm.addEventListener(
      PeerCommunicationConstants.PEER_DATA,
      this.onPeerDataReceived.bind(this)
    );
  }

  /**
   * Check if the peer data received type is ack then resume download
   */
  onPeerDataReceived({ peer_id: peer_id, data: data }) {
    if (
      data.type === "file_segment_ack" &&
      peer_id === this.peer_id &&
      data.data.transfer_id &&
      data.data.transfer_id == this.id &&
      data.data.segment_number &&
      data.data.segment_number === this.segmentNumberSending
    ) {
      console.log(`Segment ACK: ${data.data.segment_number}`);
      this.segmentNumberSending += 1;
      this.canWaitForAck = false;
      // Start asyncronously
      setTimeout(this.transfer.bind(this), 0);
    }
  }

  transfer() {
    (() => this.transferChunk())();
  }

  /**
   * Transfer the chunk to the peer
   */
  transferChunk() {
    if (this.chunkNum >= this.numberOfChunks) {
      this.emit(FILE_TRANSFER_UPLOAD_COMPLETE, {
        file: this.file,
        correlationId: this.correlationId,
        peerId: this.peer_id
      });
      return;
    }

    if (this.canWaitForAck && this.chunkNum % this.transferRate === 0) {
      // Next segment has been reached. Stop file transfer & wait for ack from receiver
      return;
    }

    this.canWaitForAck = true;
    let startByte = this.chunkSize * this.chunkNum;
    let chunk = this.file.slice(startByte, startByte + this.chunkSize);

    let reader = new FileReader();

    reader.onload = this.sendReadChunkAndContinue.bind(this);

    reader.readAsArrayBuffer(chunk);
  }

  /**
   * Send the chunk to the peer and once it is sent then move over to the next chunk
   */
  sendReadChunkAndContinue(event) {
    let buffer = event.target.result;

    console.log(
      `Sending ${this.chunkNum}/${this.numberOfChunks} length: ${buffer.length}`
    );

    this.peerComm.send(this.peer_id, {
      type: "file_chunk",
      data: {
        transfer_id: this.id,
        chunkNumber: this.chunkNum,
        totalChunks: this.numberOfChunks,
        data: this.ab2str(buffer)
      }
    });

    this.emit(FILE_TRANSFER_UPLOAD_PROGRESS, {
      chunk: this.chunkNum + 1,
      total: this.numberOfChunks,
      correlationId: this.correlationId,
      peerId: this.peer_id
    });

    // Incrementing chunk number
    this.chunkNum += 1;

    // Send next chunk
    this.transfer();
  }

  /**
   * Adds a listener for the file transfer upload progress
   */
  addOnProgressListener(callback) {
    this.on(FILE_TRANSFER_UPLOAD_PROGRESS, callback);
  }

  /**
   * Removes listener for the file transfer upload progress
   */
  removeOnProgressListener(callback) {
    this.removeListener(FILE_TRANSFER_UPLOAD_PROGRESS, callback);
  }

  /**
   * Adds a listener for the file transfer upload complete
   */
  addOnCompleteListener(callback) {
    this.on(FILE_TRANSFER_UPLOAD_COMPLETE, callback);
  }

  /**
   * Removes listener for the file transfer upload complete
   */
  removeOnCompleteListener(callback) {
    this.removeListener(FILE_TRANSFER_UPLOAD_COMPLETE, callback);
  }

  /**
   * Encodes the array buffer to string to send it over the wire
   */
  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }
}
