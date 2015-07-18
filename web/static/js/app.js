/*jshint esnext: true*/

import {Socket} from "phoenix";

import {PeerCommunicationProtocol} from "./lib/peercommunication";
import {FileInfoStore} from "./stores/fileinfostore";
import {FileListItem} from "./components/filelistitem";

class App {
    static init() {
        let getParams = App.getURLParams();
        let isInitiator = getParams["peer_id"] === undefined;

        let peerComm = new PeerCommunicationProtocol(
            isInitiator,
            null,
            (pcp) => {
                if(getParams["peer_id"]) {
                    pcp.connect(getParams["peer_id"]);
                }
            },
            (rtc) => {
                console.log("Peer Connected", rtc);
            });

        FileInfoStore.initialize(peerComm, isInitiator);

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
