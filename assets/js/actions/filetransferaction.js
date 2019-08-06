/*jshint esnext: true*/

import {AppDispatcher} from "../appdispatcher";
import FileTransferConstants from "../constants/filetransferconstants";

/**
 * Actions for file transfer
 */
export class FileTransferActions {

    /**
     * Download the file
     */
    static download(file, correlationId) {
        AppDispatcher.handleStoreAction({
            actionType: FileTransferConstants.TRANSFER_FILE_DOWNLOAD,
            file: file,
            correlationId: correlationId
        });
    }
}
