import * as React from "react";

export class ErrorBanner extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col s12">
            <p className="center-align">
              <i className="material-icons">error</i>
              <span
                dangerouslySetInnerHTML={{ __html: this.props.errorMessage }}
              />
            </p>
          </div>
        </div>
      </div>
    );
  }
}
