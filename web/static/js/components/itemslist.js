/*jshint esnext: true*/

import {ListItem} from "./listitem";

export class ItemsList extends React.Component {

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
