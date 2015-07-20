/*jshint esnext: true*/

import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";
import {PeerCommunicationProtocol} from "../lib/peercommunication";

export class PeerConnectionStatus extends React.Component {

    constructor(props) {
        super(props);
        this.state = {status: false};
    }

    componentWillMount() {
        PeerCommunicationProtocol.instance().addEventListener(PeerCommunicationConstants.PEER_CONNECTED, this.onConnectedToPeer.bind(this));
    }

    componentWillUnmount() {
        PeerCommunicationProtocol.instance().removeEventListener(PeerCommunicationConstants.PEER_CONNECTED, this.onConnectedToPeer.bind(this));
    }

    onConnectedToPeer(e) {
        this.setState({status: true});
    }

    render() {
        return (
                <div class='row'>
                    <div class='col s12'>
                        <h4 className='truncate'>{(this.state.status)? 'Connected': 'Connecting...'}</h4>
                        <div className='progress' style={{display: (this.state.status)?'none':'block'}}>
                            <div className='indeterminate'></div>
                        </div>
                    </div>
                </div>
        );
    }
}
