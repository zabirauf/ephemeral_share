/*jshint esnext: true*/

import * as React from "react";
export class ListItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = { downloadInProgress: false };
  }

  onDelete(event) {
    if (this.props.onDelete) {
      this.props.onDelete(this.props.dataNum);
    }
  }

  onSave(event) {
    console.log(`Download ${this.props.data.name}`);
    if (this.props.onSave) {
      this.setState({ downloadInProgress: true });
      this.props.onSave(this.props.dataNum);
    }
  }

  sizeInMb(bytes) {
    let mb = bytes / (1000 * 1000);
    return Math.round(mb * 100) / 100;
  }

  isSaveDisabled() {
    if (this.props.disableSave !== undefined) {
      return this.props.disableSave;
    }

    return false;
  }

  getFileAction() {
    if (this.isSaveDisabled()) {
      return (
        <a
          href="#!"
          className="secondary-content"
          onClick={this.onDelete.bind(this)}
        >
          <i className="material-icons">delete</i>
        </a>
      );
    } else if (this.props.data.downloadUrl) {
      return (
        <a
          href={this.props.data.downloadUrl}
          download={this.props.data.name}
          className="secondary-content"
        >
          <i className="material-icons">file_download</i>
        </a>
      );
    } else if (!this.state.downloadInProgress) {
      return (
        <a
          href="#!"
          className="secondary-content"
          onClick={this.onSave.bind(this)}
        >
          <i className="material-icons">cloud_download</i>
        </a>
      );
    }

    return ``;
  }

  getFileDownloadProgress() {
    if (this.props.data.downloadProgress && !this.props.data.downloadUrl) {
      return (
        <div className="progress">
          <div
            className="determinate"
            style={{ width: `${this.props.data.downloadProgress}%` }}
          />
        </div>
      );
    } else {
      return ``;
    }
  }

  getFileUploadProgress() {
    if (this.props.data.uploadProgress) {
      return Object.keys(this.props.data.uploadProgress).map(key => {
        return (
          <div className="progress">
            <div
              className="determinate"
              style={{
                width: `${this.props.data.uploadProgress[key].percentage}%`
              }}
            />
          </div>
        );
      });
    } else {
      return ``;
    }
  }

  render() {
    let fileItem = {
      marginTop: "2px",
      marginBottom: "3px"
    };

    return (
      <li className="hoverable collection-item avatar" style={fileItem}>
        <i className="material-icons circle">insert_drive_file</i>
        <span className="title truncate">{this.props.data.name}</span>
        <p>Size: {this.sizeInMb(this.props.data.size)} MB</p>
        {this.getFileDownloadProgress()}
        {this.getFileUploadProgress()}
        {this.getFileAction()}
      </li>
    );
  }
}
