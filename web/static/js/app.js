/*jshint esnext: true*/

import {Socket} from "phoenix";

import {PeerCommunicationProtocol} from "./lib/peercommunication";
import {FileInfoStore} from "./stores/fileinfostore";
import {FileShareApp} from "./components/filelistitem";
import {FileTransferManager} from "./lib/filetransfermanager";
import {ErrorBanner} from "./components/errorbanner";

class App {
    static init() {

        let webRTCSupported = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        let webSocketSupported = "WebSocket" in window;
        let isAppSupported = webRTCSupported && webSocketSupported;

        let getParams = App.getURLParams();
        let isInitiator = getParams.peer_id === undefined;

        let peer_id = null;
        if(getParams.peer_id) {
            peer_id = getParams.peer_id;
        }

        PeerCommunicationProtocol.initialize(
            isInitiator,
            null,
            (pcp) => {
                if(peer_id) {
                    pcp.connect(peer_id);
                }
            },
            (rtc) => {
                console.log("Peer Connected", rtc);
            });

        FileInfoStore.initialize(isInitiator);
        FileTransferManager.initialize(peer_id);

        // After the store dependency FileTransferManager is created we call the initialize on store instance
        // TODO: Have a better way instead of a circular dependency
        FileInfoStore.instance().initialize();

        if(isAppSupported) {
            React.render(
                    <FileShareApp
                disableDrop={!isInitiator} />,
                document.getElementById("react-container")
            );
        }
        else {
            React.render(
                    <ErrorBanner errorMessage="Your browser is not supported. Please use the latest version of <a href='http://www.google.com/chrome/' target='_blank'>Chrome</a> or <a href='https://www.mozilla.org/en-US/firefox/new/' target='_blank'>Firefox</a>" />,
                document.getElementById("react-container"));
        }
    }

    static getURLParams() {
        var queryDict = {};
        location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]});
        return queryDict;
    }
}

$( () => App.init() );

export default App;
