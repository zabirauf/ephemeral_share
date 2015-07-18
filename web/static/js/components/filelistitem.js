/*jshint esnext: true*/

import {ItemsList} from "./itemslist";
import {FileHandler} from "./filehandler";
import {FileInfoStore} from "../stores/fileinfostore";
import {FileActions} from "../actions/fileactions";

export class FileListItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {items: []};
    }

    componentWillMount() {
        FileInfoStore.instance().addChangeListener(this.onStoreFileUpdated.bind(this));
    }

    componentWillUnmount() {
        FileInfoStore.instance().removeChangeListener(this.onStoreFileUpdated.bind(this));
    }

    onStoreFileUpdated(files) {
        this.setState({items: files});
    }

    onFileDeleted(index) {
        FileActions.destroy(index);
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
