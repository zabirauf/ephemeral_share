/*jshint esnext: true*/

export class FileHandler extends React.Component {

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
