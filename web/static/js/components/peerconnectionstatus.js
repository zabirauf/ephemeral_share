/*jshint esnext: true*/

import PeerCommunicationConstants from "../constants/PeerCommunicationConstants";
import {PeerCommunicationProtocol} from "../lib/peercommunication";

const STATUS_CONNECTING = 0;
const STATUS_CONNECTED = 1;
const STATUS_DOES_NOT_EXIST = 2;

export class PeerConnectionStatus extends React.Component {

    constructor(props) {
        super(props);
        this.state = {status: STATUS_CONNECTING};
    }

    componentWillMount() {
        PeerCommunicationProtocol.instance().addEventListener(PeerCommunicationConstants.PEER_CONNECTED, this.onConnectedToPeer.bind(this));
        PeerCommunicationProtocol.instance().addEventListener(PeerCommunicationConstants.PEER_DOES_NOT_EXIST, this.onPeerDoesNotExist.bind(this));
    }

    componentWillUnmount() {
        PeerCommunicationProtocol.instance().removeEventListener(PeerCommunicationConstants.PEER_CONNECTED, this.onConnectedToPeer.bind(this));
        PeerCommunicationProtocol.instance().removeEventListener(PeerCommunicationConstants.PEER_DOES_NOT_EXIST, this.onPeerDoesNotExist.bind(this));
    }

    onPeerDoesNotExist(m) {
        this.setState({status: STATUS_DOES_NOT_EXIST});
    }

    onConnectedToPeer(e) {
        this.setState({status: STATUS_CONNECTED});
    }

    getStatusMessage() {
        if(this.state.status === STATUS_CONNECTING) {
            return 'Connecting ...';
        }
        else if(this.state.status === STATUS_CONNECTED) {
            return 'Connected';
        }
        else if(this.state.status === STATUS_DOES_NOT_EXIST) {
            return 'Error: Incorrect share link. Please ask the user to send you the share link again.';
        }

        return 'Please refresh and make sure the share link is correct';
    }

    getWorkingBar() {
        if(this.state.status == STATUS_CONNECTING) {
            return (<div className='progress'>
                    <div className='indeterminate'></div>
                    </div>);
        }

        return '';
    }

    render() {
        return (
                <div class='row'>
                    <div class='col s12'>
                        <div className='truncate'>{this.getStatusMessage()}</div>
                        {this.getWorkingBar()}
                    </div>
                </div>
        );
    }
}
