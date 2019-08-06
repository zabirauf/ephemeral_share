/*jshint esnext: true*/

import * as React from "react";
import { ListItem } from "./listitem";

export class ItemsList extends React.Component {
  constructor(props) {
    super(props);
  }

  createItem(item, i) {
    return (
      <ListItem
        disableSave={this.props.disableSave}
        key={i}
        data={item}
        dataNum={i}
        onDelete={this.props.onItemDelete}
        onSave={this.props.onItemSave}
      />
    );
  }

  getHeaderItem() {
    if (this.props.headerText) {
      return (
        <li className="collection-item">
          <h5 className="center-align">{this.props.headerText}</h5>
        </li>
      );
    }

    return ``;
  }

  render() {
    let items = this.props.items.map(this.createItem.bind(this));
    return (
      <ul className="collection">
        {this.getHeaderItem()}
        {items}
      </ul>
    );
  }
}
