/*jshint esnext: true*/

import {AppDispatcher} from "../appdispatcher";
import FileTransferConstants from "../constants/filetransferconstants";

export class FileTransferActions {

    static download(file, correlationId) {
        AppDispatcher.handleStoreAction({
            actionType: FileTransferConstants.TRANSFER_FILE_DOWNLOAD,
            file: file,
            correlationId: correlationId
        });
    }
}
