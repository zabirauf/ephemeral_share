/*jshint esnext: true*/

import {Socket} from "phoenix";

// let socket = new Socket("/ws")
// socket.connect()
// let chan = socket.chan("topic:subtopic", {})
// chan.join().receive("ok", chan => {
//   console.log("Success!")
// })

class VideoStreamer {

    constructor(elementId, fileHandler, mediaSource) {
        this.videoPlayer = document.getElementById(elementId);
        fileHandler.onFileSelected( (f) => this.onFileSelected(f));
        this.mediaSource = mediaSource;
        this.sliceEventListeners = [];
    }

    onFileSelected(files) {
        if(files.length > 0)
        {
            // Select the first item to stream
            this.stream(files[0]);
        }
    }

    stream(file) {
        let sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vorbis, vp8"');
        this.streamSlicedVideo(file, sourceBuffer, 0);
    }

    streamSlicedVideo(file, sourceBuffer, chunkNum) {
        const chunkSize = 5294080; // 5 MB chunks

        let numberOfChunks = Math.ceil(file.size/chunkSize);

        if(chunkNum >= numberOfChunks) {
            return;
        }

        let startByte = chunkSize * chunkNum;
        let chunk = file.slice(startByte, startByte+chunkSize);

        let reader = new FileReader();

        reader.onload = ((idx) => {

            let videoStreamer = this;
            let videoPlayer = this.videoPlayer;
            return (e) => {
                sourceBuffer.appendBuffer(new Uint8Array(e.target.result));

                let onUpdateEnded = (e) => {
                    if(chunkNum == numberOfChunks - 1) {
                        videoStreamer.mediaSource.endOfStream();
                    }

                    if(videoPlayer.paused) {
                        videoPlayer.play();
                    }

                    e.target.removeEventListener('updateend', videoStreamer.sliceEventListeners[chunkNum]);
                    this.streamSlicedVideo(file, sourceBuffer, ++chunkNum);
                };

                videoStreamer.sliceEventListeners.push(onUpdateEnded);
                sourceBuffer.addEventListener('updateend', onUpdateEnded);
            };
        })(chunkNum);

        reader.readAsArrayBuffer(chunk);
    }
}

class FileHandler {
    constructor(elementId) {
        let dropZone = document.getElementById(elementId);
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e), false);
        dropZone.addEventListener('drop', (e) => this.handleFileSelect(e), false);

        this.onFileSelectedCallback = null;
    }

    handleDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleFileSelect(event) {
        event.stopPropagation();
        event.preventDefault();

        let files = event.dataTransfer.files;

        if(this.onFileSelectedCallback)
        {
            this.onFileSelectedCallback(files);
        }

    }

    onFileSelected(func) {
        this.onFileSelectedCallback = func;
    }
}

class App {

    static init() {
        const dropZoneElementId = "drop-zone";
        const videoPlayerElementId = "video-player";
        window.MediaSource = window.MediaSource || window.WebKitMediaSource;

        let videoPlayer = document.getElementById(videoPlayerElementId);
        let mediaSource = new MediaSource();

        videoPlayer.src = window.URL.createObjectURL(mediaSource);
        let fileHandler = new FileHandler(dropZoneElementId);
        let videoStreamer = new VideoStreamer(videoPlayerElementId, fileHandler, mediaSource);
    }
}

$( () => App.init() );
export default App;
