/*jshint esnext: true*/
import EventEmitter from "events";
import { PeerCommunicationProtocol } from "./peercommunication";
import { FileTransferSender } from "./filetransfersender";
import { FileTransferReceiver } from "./filetransferreceiver";
import { AppDispatcher } from "../appdispatcher";
import { FileInfoStore } from "../stores/fileinfostore";
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
    if (_instance === null) {
      _instance = new FileTransferManager(
        PeerCommunicationProtocol.instance(),
        peer_id
      );
    }
  }

  constructor(peerComm, peer_id) {
    super();

    // Registering the store with dispatcher
    this.dispatcherIndex = AppDispatcher.register(
      this.dispatchAction.bind(this)
    );

    this.peerComm = peerComm;
    this.files = [];
    this.peer_id = peer_id;
    this.peerComm.addEventListener(
      PeerCommunicationConstants.PEER_DATA,
      this.onPeerDataReceived.bind(this)
    );
    FileInfoStore.instance().addChangeListener(this.onFilesUpdated.bind(this));
  }

  dispatchAction({ source: source, action: action }) {
    switch (action.actionType) {
      case FileTransferConstants.TRANSFER_FILE_DOWNLOAD:
        this.downloadFile(
          this.peer_id,
          action.file,
          this.onFileDownloaded.bind(this),
          this.onFileDownloadProgress.bind(this),
          action.correlationId
        );
    }
  }

  /*******************************************
   *** Download complete & progress events ***
   *******************************************/

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
    this.removeListener(
      FileTransferConstants.TRANSFER_FILE_DOWNLOAD_COMPLETE,
      callback
    );
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
    this.removeListener(
      FileTransferConstants.TRANSFER_FILE_DOWNLOAD_PROGRESS,
      callback
    );
  }

  /**
   * Called when the file chunk is downloaded
   */
  onFileDownloadProgress(f) {
    console.log("File download progress", f);
    this.emit(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_PROGRESS, f);
  }

  /**
   * Called when the file is downloaded from the peer
   */
  onFileDownloaded(f) {
    console.log("File Downloaded", f);
    this.emit(FileTransferConstants.TRANSFER_FILE_DOWNLOAD_COMPLETE, f);
  }

  /*****************************************
   *** Upload complete & progress events ***
   *****************************************/

  /**
   * Adds a listener for the file upload complete
   */
  addOnFileUploadCompleteListener(callback) {
    this.on(FileTransferConstants.TRANSFER_FILE_UPLOAD_COMPLETE, callback);
  }

  /**
   * Removes listener for the file upload complete
   */
  removeOnFileUploadCompleteListener(callback) {
    this.removeListener(
      FileTransferConstants.TRANSFER_FILE_UPLOAD_COMPLETE,
      callback
    );
  }

  /**
   * Adds a listener for the file upload progress
   */
  addOnFileUploadProgressListener(callback) {
    this.on(FileTransferConstants.TRANSFER_FILE_UPLOAD_PROGRESS, callback);
  }

  /**
   * Removes listener for the file upload progress
   */
  removeOnFileUploadProgressListener(callback) {
    this.removeListener(
      FileTransferConstants.TRANSFER_FILE_UPLOAD_PROGRESS,
      callback
    );
  }

  /**
   * Called when the file chunk is uploaded
   */
  onFileUploadProgress(f) {
    console.log("File upload progress", f);
    this.emit(FileTransferConstants.TRANSFER_FILE_UPLOAD_PROGRESS, f);
  }

  /**
   * Called whent the file upload to a particular peer is completed
   */
  onFileUploaded(f) {
    console.log("File Uploaded", f);
    this.emit(FileTransferConstants.TRANSFER_FILE_UPLOAD_COMPLETE, f);
  }

  /**
   * Called when the data from peer is received. If the request type is "download" it
   * initiates the upload of file
   */
  onPeerDataReceived({ peer_id: peer_id, data: data }) {
    let { type: type, data: payload } = data;
    if (type === "download") {
      this.startFileTransfer(peer_id, payload);
    }
  }

  onFilesUpdated(files) {
    this.files = files;
  }

  /**
   * Start upload of the file
   */
  startFileTransfer(
    peer_id,
    { name: name, transfer_id: id, transfer_rate: transferRate }
  ) {
    let file = this.files.filter(f => f.name === name);
    if (file && file.length > 0) {
      // Take the first file
      file = file[0];

      let correlationId = this.files.indexOf(file);

      let uploader = new FileTransferSender(
        this.peerComm,
        peer_id,
        file,
        id,
        correlationId,
        transferRate
      );
      uploader.addOnCompleteListener(this.onFileUploaded.bind(this));
      uploader.addOnProgressListener(this.onFileUploadProgress.bind(this));

      // Start the file upload
      uploader.transfer();
    }
  }

  /**
   * Download the file from the peer
   */
  downloadFile(peer_id, file, callback, progressCallback, correlationId) {
    let downloader = new FileTransferReceiver(
      this.peerComm,
      peer_id,
      file,
      correlationId
    );
    downloader.addOnCompleteListener(callback);
    downloader.addOnProgressListener(progressCallback);

    // Start the file download
    downloader.download();
  }
}
