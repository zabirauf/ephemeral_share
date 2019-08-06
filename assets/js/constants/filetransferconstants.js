
module.exports = {
    // File transfer related events
    TRANSFER_FILE_DOWNLOAD: "transfer_file_download",
    TRANSFER_FILE_DOWNLOAD_PROGRESS: "transfer_file_download_progress",
    TRANSFER_FILE_DOWNLOAD_COMPLETE: "transfer_file_download_complete",
    TRANSFER_FILE_UPLOAD_PROGRESS: "transfer_file_upload_progress",
    TRANSFER_FILE_UPLOAD_COMPLETE: "transfer_file_upload_complete",

    // Other file transfer related constants
    // Currently set to 1 to have reliable transfer
    // as each chunk will be acked, but will be slow
    TRANSFER_RATE: 1
};
