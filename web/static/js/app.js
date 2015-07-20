/*jshint esnext: true*/

import {Socket} from "phoenix";

import {PeerCommunicationProtocol} from "./lib/peercommunication";
import {FileInfoStore} from "./stores/fileinfostore";
import {FileListItem} from "./components/filelistitem";
import {FileTransferManager} from "./lib/filetransfermanager";

class App {
    static init() {
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

        React.render(
                <FileListItem
            disableDrop={!isInitiator} />,
            document.getElementById("react-container")
        );
    }

    static getURLParams() {
        var queryDict = {};
        location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]});
        return queryDict;
    }
}

$( () => App.init() );

export default App;
