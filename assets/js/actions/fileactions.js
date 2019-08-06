/*jshint esnext: true*/

import {AppDispatcher} from "../appdispatcher";
import FileConstants from "../constants/fileconstants";

/**
 * Actions for file store
 */
export class FileActions {

    /**
     * Create a file
     */
    static create(file) {
        AppDispatcher.handleViewAction({
            actionType: FileConstants.FILE_CREATE,
            file: file
        });
    }

    /**
     * Remove a file
     */
    static destroy(id) {
        AppDispatcher.handleViewAction({
            actionType: FileConstants.FILE_DESTROY,
            id: id
        });
    }

    /**
     * Download the file
     */
    static download(id) {
        AppDispatcher.handleViewAction({
            actionType: FileConstants.FILE_DOWNLOAD,
            id: id,
        });
    }
}
