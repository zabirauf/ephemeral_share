/*jshint esnext: true*/

import {Socket} from "phoenix";

import {PeerCommunicationProtocol} from "./peer-communication";
import {FileInfoStore} from "./file-share";

class FileHandler extends React.Component {

    constructor(props) {
        super(props);
    }

    dragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    drop(event) {
        event.stopPropagation();
        event.preventDefault();

        let files = event.dataTransfer.files;

        if(this.props.onFileSelected)
        {
            this.props.onFileSelected(files);
        }
    }

    /* Render */
    render() {
        return (
            <div draggable='true' style={{height: '100px'}} className="card-panel" onDragOver={this.dragOver.bind(this)} onDrop={this.drop.bind(this)}>
                Drop File
            </div>
        );
    }
}

class ItemsList extends React.Component {

    constructor(props) {
        super(props);
    }

    createItem(item, i) {
        return (
                <ListItem disableSave={this.props.disableSave} key={i} data={item} dataNum={i} onDelete={this.props.onItemDelete.bind(this)} />
        );
    }

    render() {
        let items = this.props.items.map(this.createItem.bind(this));
        return (
            <ul className='collection'>
                {items}
            </ul>
        );
    }
}

class ListItem extends React.Component {

    constructor(props) {
        super(props);
    }

    onDelete(event) {
        if(this.props.onDelete) {
            this.props.onDelete(this.props.dataNum);
        }
    }

    onSave(event) {
        console.log(`Download ${this.props.data.name}`);
    }

    sizeInMb(bytes) {
        let mb = bytes / (1000*1000);
        return Math.round(mb*100)/100;
    }

    isSaveDisabled() {
        if(this.props.disableSave !== undefined) {
            return this.props.disableSave;
        }

        return false;
    }

    getFileAction() {
        if(this.isSaveDisabled()) {
            return (
                    <a href="#!" className='secondary-content' onClick={this.onDelete.bind(this)}>
                    <i className='material-icons'>delete</i>
                    </a>);
        }
        else {
            return (
                    <a href="#!" className='secondary-content' onClick={this.onSave.bind(this)}>
                    <i className='material-icons'>cloud_download</i>
                    </a>
            );
        }
    }

    render() {
        return (
           <li className='collection-item avatar'>
                <i className='material-icons circle'>insert_drive_file</i>  
               <span className='title'>{this.props.data.name}</span>
                <p>Size: {this.sizeInMb(this.props.data.size)} MB</p>
                {this.getFileAction()}
           </li>
        );
    }
}

class FileListItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {items: []}; 
    }

    componentWillMount() {
        if(this.props.store) {
            this.props.store.addChangeListener(this.onStoreFileUpdated.bind(this));
        }
    }

    componentWillUnmount() {
        if(this.props.store) {
            this.props.store.removeChangeListener(this.onStoreFileUpdated.bind(this));
        }
    }

    onStoreFileUpdated(files) {
        this.setState({items: files});
    }

    onFileDeleted(index) {
        this.state.items.splice(index, 1);
        this.setState({items: this.state.items});
        this.filesUpdated(this.state.items);
    }

    onFileAdded(files) {
        let updated_items = this.mergeFileList(this.state.items, files);
        this.setState({items: updated_items});
        this.filesUpdated(updated_items);
    }

    filesUpdated(files) {
        if(this.props.onFilesUpdated) {
            this.props.onFilesUpdated(files);
        }
    }

    mergeFileList(agg, filelist) {
        for(let i=0; i< filelist.length; i++)
        {
            agg.push(filelist[i]);
        }

        return agg;
    }

    fileDropDisabled() {
        if(this.props.disableDrop) {
            return this.props.disableDrop;
        }

        return false;
    }

    render() {
        return (
            <div className='container'>
                <div className='row' style={{display: (this.fileDropDisabled() ? "none":"block")}}>
                    <div className='col s12'>
                         <FileHandler onFileSelected={this.onFileAdded.bind(this)} />
                    </div>
                </div>
                <div className='row'>
                    <div className='col s12'>
                <ItemsList disableSave={!this.fileDropDisabled()} items={this.state.items} onItemDelete={this.onFileDeleted.bind(this)}/>
                    </div>
                </div>
            </div>
        );
    }
}

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

        let fileInfoStore = new FileInfoStore(peerComm, isInitiator);

        React.render(
                <FileListItem
            onFilesUpdated={fileInfoStore.onFilesUpdated.bind(fileInfoStore)}
            disableDrop={!isInitiator}
            store={fileInfoStore} />,
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
