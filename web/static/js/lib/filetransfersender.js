/*jshint esnext: true*/

export class FileTransferSender extends EventEmitter {
    constructor(peerComm, peer_id, file, id) {
        super();
        this.chunkSize = 16 * 1024;

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

        reader.onload = this.sendReadChunkAndContinue.bind(this);

        reader.readAsArrayBuffer(chunk);
    }

    sendReadChunkAndContinue(event) {
        let buffer = event.target.result;

        console.log(`Sending ${this.chunkNum}/${this.numberOfChunks} length: ${buffer.length}`);

        this.peerComm.send(this.peer_id, {type: "file_chunk", data: {
            transfer_id: this.id,
            chunkNumber: this.chunkNum,
            totalChunks: this.numberOfChunks,
            data: this.ab2str(buffer)
        }});

        // Incrementing chunk number
        this.chunkNum += 1;

        // Send next chunk
        this.transfer();
    }

    ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
}
