/*jshint esnext: true*/

import {PeerCommunicationProtocol} from "./peercommunication";
import {FileTransferSender} from "./filetransfersender";
import {FileTransferReceiver} from "./filetransferreceiver";
import {AppDispatcher} from "../appdispatcher";
import {FileInfoStore} from "../stores/fileinfostore";
import FileTransferConstants from "../constants/filetransferconstants";
import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";

let _instance = null;

/**
 * The file manager for downloading and send files requested by the peer
 */
export class FileTransferManager extends EventEmitter {

    static instance() {
        return _instance;
    }

    static initialize(peer_id) {
        if(_instance === null) {
            _instance = new FileTransferManager(PeerCommunicationProtocol.instance(), peer_id);
        }
    }

    constructor(peerComm, peer_id) {
        super();

        // Registering the store with dispatcher
        this.dispatcherIndex = AppDispatcher.register(this.dispatchAction.bind(this));

        this.peerComm = peerComm;
        this.files = [];
        this.peer_id = peer_id;
        this.peerComm.addEventListener(PeerCommunicationConstants.PEER_DATA, this.onPeerDataReceived.bind(this));
        FileInfoStore.instance().addChangeListener(this.onFilesUpdated.bind(this));
    }

    dispatchAction({source: source, action: action}) {
        switch(action.actionType) {
        case FileTransferConstants.TRANSFER_FILE_DOWNLOAD:
            this.downloadFile(
                this.peer_id,
                action.file,
                this.onFileDownloaded.bind(this),
                this.onFileDownloadProgress.bind(this),
                action.correlationId);
        }
    }

    /**
     * Adds a listener for the file transfer complete
     */
    addOnFileDownloadCompleteListener(callback) {
        this.on(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_COMPLETE, callback);
    }

    /**
     * Removes listener for the file transfer complete
     */
    removeOnFileDownloadCompleteListener(callback) {
        this.removeListener(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_COMPLETE, callback);
    }

    /**
     * Adds a listener for the file transfer progress
     */
    addOnFileDownloadProgressListener(callback) {
        this.on(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_PROGRESS, callback);
    }

    /**
     * Removes listener for the file transfer progress
     */
    removeOnFileDownloadProgressListener(callback) {
        this.removeListener(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_PROGRESS, callback);
    }

    onFileDownloadProgress(f) {
        console.log("File download progress", f);
        this.emit(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_PROGRESS, f);
    }

    onFileDownloaded(f) {
        console.log("File Downloaded", f);
        this.emit(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_COMPLETE, f);
    }

    /**
     * Called when the data from peer is received. If the request type is "download" it
     * initiates the upload of file
     */
    onPeerDataReceived({peer_id: peer_id, data: data}) {
        let {type: type, data: payload} = data;
        if(type === "download") {
            this.startFileTransfer(peer_id, payload);
        }
    }

    onFilesUpdated(files) {
        this.files = files;
    }

    /**
     * Start upload of the file
     */
    startFileTransfer(peer_id, {name: name, transfer_id: id}) {
        let file = this.files.filter((f) => f.name === name);
        if(file && file.length > 0) {
            // Take the first file
            file = file[0];

            new FileTransferSender(this.peerComm, peer_id, file, id).transfer();
        }
    }

    /**
     * Download the file from the peer
     */
    downloadFile(peer_id, file, callback, progressCallback, correlationId) {
        let downloader = new FileTransferReceiver(this.peerComm, peer_id, file, correlationId);
        downloader.addOnCompleteListener(callback);
        downloader.addOnProgressListener(progressCallback);
        downloader.download();
    }
}
