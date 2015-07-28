/*jshint esnext: true*/

import {PeerCommunicationProtocol} from "../lib/peercommunication";
import FileConstants from "../constants/fileconstants";
import {AppDispatcher} from "../appdispatcher";
import {FileTransferManager} from "../lib/filetransfermanager";
import {FileTransferActions} from "../actions/filetransferaction";
import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";

const  UPDATE_FILE_EVENT = "file-update-event";

// Using it to make it a singleton class
let _instance = null;

/**
 * The flux store which handles all the file information including the
 * blob associated with it once it downloads
 */
export class FileInfoStore extends EventEmitter {

    static instance() {
        return _instance;
    }

    static initialize(isInitiator) {
        if(this.instance() === null) {
            _instance = new FileInfoStore(PeerCommunicationProtocol.instance(), isInitiator);
        }
    }

    constructor(peerComm, isInitiator) {
        super();

        this.peerComm = peerComm;
        this.isInitiator = isInitiator;
        this.files = [];

        // Registering the store with dispatcher
        this.dispatcherIndex = AppDispatcher.register(this.dispatchAction.bind(this));


        // The initiator only sends data and is not bothered about receiving and reciprocal for the client peers
        if(this.isInitiator) {
            this.peerComm.addEventListener(PeerCommunicationConstants.PEER_CONNECTED, this.onPeerConnected.bind(this));
        }
        else {
            this.peerComm.addEventListener(PeerCommunicationConstants.PEER_DATA, this.onPeerDataReceived.bind(this));
        }
    }

    initialize() {
        FileTransferManager.instance().addOnFileDownloadCompleteListener(this.onFileDownloadComplete.bind(this));
        FileTransferManager.instance().addOnFileDownloadProgressListener(this.onFileDownloadProgress.bind(this));
    }

    dispatchAction({source: source, action: action}) {
        switch(action.actionType) {
        case FileConstants.FILE_CREATE:
            this.addFile(action.file);
            this.notifyUpdatedFiles(this.files);
            break;

        case FileConstants.FILE_DESTROY:
            this.removeFile(action.id);
            this.notifyUpdatedFiles(this.files);
            break;

        case FileConstants.FILE_DOWNLOAD:
            let index = action.id;
            this.callAsync(this.downloadFile.bind(this, index));
            break;
        }

        return true;
    }

    callAsync(func) {
        setTimeout(func, 0);
    }

    getAll() {
        return this.files;
    }

    onFileDownloadComplete({file: file, blob: fileBlob, correlationId: index}) {
        this.files[index].downloadedBlob = fileBlob;
        this.files[index].downloadUrl = window.URL.createObjectURL(fileBlob);
        this.notifyUpdatedFiles(this.files);
    }

    onFileDownloadProgress({chunk: chunk, total: total, correlationId: index}) {
        this.files[index].downloadProgress = Math.ceil(chunk/total * 100);
        this.notifyUpdatedFiles(this.files);
    }

    onPeerConnected({peer_id: peer_id, peer_comm: p}) {
        p.send(peer_id, this.getDataForPeer(this.files));
    }

    /**
     * Add a file to the list and send that information to all the connected peers
     */
    addFile(file) {
        console.log("File added, sending to all peers", file);
        this.files.push(file);
        this.peerComm.sendToAllConnectedPeers(this.getDataForPeer(this.files));
        this.notifyUpdatedFiles(this.files);
    }

    /**
     * Removes a file to the list and send that information to all connected peers
     */
    removeFile(index) {
        console.log("File removed, sending to all peers", index);
        this.files.splice(index, 1);
        this.peerComm.sendToAllConnectedPeers(this.getDataForPeer(this.files));
        this.notifyUpdatedFiles(this.files);
    }

    /**
     * Download the file
     */
    downloadFile(index) {
        let file = this.files[index];
        FileTransferActions.download(file, index);
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

    /**
     * Called when the data is received from the peer. In case of "files" type it updates
     * the file information in the store
     */
    onPeerDataReceived({peer_id: peer_id, data: data}) {
        console.log(`FileInfoStore: Peer Data Received from ${peer_id}`);
        if(data.type === "files") {
            this.onPeerFilesReceived(data.data);
        }
    }

    onPeerFilesReceived(files) {
        this.files = this.mergeFileInformation(this.files, files);

        this.notifyUpdatedFiles(this.files);
    }

    /**
     * Merges file information with existing files, so that if a file is dowloaded before
     * then that information is still retained
     */
    mergeFileInformation(filesToMergeTo, filesToMerge) {
        let files = [];

        for(let file of filesToMerge) {
            let found = filesToMergeTo.filter((f) => {
                return f.name === file.name && f.size === file.size && f.downloadUrl;
            });

            if(found && found.length > 0) {
                files.push(found[0]);
            }
            else {
                files.push(file);
            }
        }

        this.clearOldArray(filesToMergeTo);

        return files;
    }

    clearOldArray(oldFiles) {
        for(let i=0;i<oldFiles.length;i++) {
            oldFiles[i] = null;
        }
    }

    notifyUpdatedFiles(files) {
        this.emit(UPDATE_FILE_EVENT, files);
    }

    addChangeListener(callback) {
        this.on(UPDATE_FILE_EVENT, callback);
    }

    removeChangeListener(callback) {
        this.removeListener(UPDATE_FILE_EVENT, callback);
    }
}
