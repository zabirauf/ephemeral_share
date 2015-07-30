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

        let featureIcon = {
            marginRight: "4px"
        };

        return (
                <div draggable='true' style={{height: '70vh'}} className="card-panel hoverable" onDragOver={this.dragOver.bind(this)} onDrop={this.drop.bind(this)}>
                    <div className='flow-text'>
                        <ul>
                            <li><span style={featureIcon}><i className='material-icons'>lock</i></span>Secure</li>
                            <li><span style={featureIcon}><i className='material-icons'>visibility_off</i></span>Private</li>
                            <li><span style={featureIcon}><i className='material-icons'>swap_horiz</i></span>Direct from you to receiver</li>
                        </ul>
                    </div>

                    <p>
                        How to share:
                        <ol>
                        <li>Drag & Drop file in this box</li>
                        <li>Share the link with the receipient</li>
                        <li>Wait for them to download</li>
                        </ol>
                    </p>
                    <h5 className='center-align'>Drop file here</h5>
                </div>
        );
    }
}
