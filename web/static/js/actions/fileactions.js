/*jshint esnext: true*/

import {AppDispatcher} from "../appdispatcher";
import FileConstants from "../constants/fileconstants";

export class FileActions {

    static create(file) {
        AppDispatcher.handleViewAction({
            actionType: FileConstants.FILE_CREATE,
            file: file
        });
    }

    static destroy(id) {
        AppDispatcher.handleViewAction({
            actionType: FileConstants.FILE_DESTROY,
            id: id
        });
    }

    static download(id) {
        AppDispatcher.handleViewAction({
            actionType: FileConstants.FILE_DOWNLOAD,
            id: id,
        });
    }
}
