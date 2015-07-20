/*jshint esnext: true*/

import {ItemsList} from "./itemslist";
import {FileHandler} from "./filehandler";
import {PeerConnectionStatus} from "./peerconnectionstatus";
import {FileInfoStore} from "../stores/fileinfostore";
import {FileActions} from "../actions/fileactions";
import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";
import {PeerCommunicationProtocol} from "../lib/peercommunication";

export class FileListItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {items: [], shareURL: null};
    }

    componentWillMount() {
        FileInfoStore.instance().addChangeListener(this.onStoreFileUpdated.bind(this));
        PeerCommunicationProtocol.instance().addEventListener(PeerCommunicationConstants.CONNECTED, this.onConnectedToServer.bind(this));

        let id = PeerCommunicationProtocol.instance().getId();
        this.createShareURLAndUpdateIfValid(id);
    }

    componentWillUnmount() {
        FileInfoStore.instance().removeChangeListener(this.onStoreFileUpdated.bind(this));
        PeerCommunicationProtocol.instance().removeEventListener(PeerCommunicationConstants.CONNECTED, this.onConnectedToServer.bind(this));
    }

    createShareURLAndUpdateIfValid(id) {
        if(id !== null) {
            let shareURL = `${location.protocol}//${location.host}/?peer_id=${id}`;
            this.setState({shareURL: shareURL});
        }
    }

    onConnectedToServer(p) {
        let id = PeerCommunicationProtocol.instance().getId();
        this.createShareURLAndUpdateIfValid(id);
    }

    onStoreFileUpdated(files) {
        this.setState({items: files});
    }

    onFileDeleted(index) {
        FileActions.destroy(index);
    }

    onFileDownload(index) {
        console.log(`Download ${index}`);
        FileActions.download(index);
    }

    onFileAdded(files) {
        for(let i = 0;i < files.length; i++) {
            FileActions.create(files[i]);
        }
    }

    fileDropDisabled() {
        if(this.props.disableDrop) {
            return this.props.disableDrop;
        }

        return false;
    }

    onShareURLFocus(event) {
        let target = event.target;
        setTimeout(() => {
            target.select();
        }, 0);
    }

    getShareLocation() {
        return (
             <div className='row' style={{display: (this.fileDropDisabled() ? "none":"block")}} >
                <div >
                    <div className='progress' style={{display: (this.state.shareURL)?'none':'block'}}>
                        <div className='indeterminate'></div>
                    </div>
                    <div className='input-field col s12' style={{display: (this.state.shareURL)?'block':'none'}}>
                       <p>Select and Ctrl - C to copy and share the url</p>
                        <input id='share-url' onFocus={this.onShareURLFocus} type='text' value={this.state.shareURL}  />
                    </div>
                </div>
            </div>);
    }

    render() {
        return (
                <div className='container'>
                {(this.fileDropDisabled())?<PeerConnectionStatus /> : ``}
                {this.getShareLocation()}
                <div className='row' style={{display: (this.fileDropDisabled() ? "none":"block")}}>
                    <div className='col s12'>
                         <FileHandler onFileSelected={this.onFileAdded.bind(this)} />
                    </div>
                </div>
                <div className='row'>
                    <div className='col s12'>
                <ItemsList disableSave={!this.fileDropDisabled()} items={this.state.items} onItemDelete={this.onFileDeleted.bind(this)} onItemSave={this.onFileDownload.bind(this)}/>
                    </div>
                </div>
            </div>
        );
    }
}
