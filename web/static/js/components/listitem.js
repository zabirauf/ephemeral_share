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
