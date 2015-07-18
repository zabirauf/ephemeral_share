/*jshint esnext: true*/

import {PeerCommunicationEvent, PeerCommunicationProtocol} from "./peer-communication";
import {FileTransferSender} from "./filetransfersender";
import {FileTransferReceiver} from "./filetransferreceiver";

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
