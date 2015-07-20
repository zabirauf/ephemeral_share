/*jshint esnext: true*/

export class ListItem extends React.Component {

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
        if(this.props.onSave) {
            this.props.onSave(this.props.dataNum);
        }
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
        else if(this.props.data.downloadUrl) {
            return (
                    <a href={this.props.data.downloadUrl} download={this.props.data.name} className='secondary-content'>
                    <i className='material-icons'>file_download</i>
                    </a>
            );
        }
        else {
            return (
                    <a href="#!" className='secondary-content' onClick={this.onSave.bind(this)}>
                    <i className='material-icons'>cloud_download</i>
                    </a>
            );
        }
    }

    getFileDownloadProgress() {
        if(this.props.data.downloadProgress && !this.props.data.downloadUrl) {
            return (
                    <div className="progress">
                    <div className="determinate" style={{width: `${this.props.data.downloadProgress}%`}}></div>
                    </div>
            );
        }
        else {
            return ``;
        }
    }

    render() {
        return (
           <li className='collection-item avatar'>
                <i className='material-icons circle'>insert_drive_file</i>  
               <span className='title'>{this.props.data.name}</span>
                <p>Size: {this.sizeInMb(this.props.data.size)} MB</p>
                {this.getFileDownloadProgress()}
                {this.getFileAction()}
           </li>
        );
    }
}
