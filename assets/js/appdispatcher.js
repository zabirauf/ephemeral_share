/*jshint esnext: true*/

import { Dispatcher } from "flux";

const dispatcher = new Dispatcher();

export class AppDispatcher {
  static register(callback) {
    return dispatcher.register(callback);
  }

  static dispatch(action) {
    dispatcher.dispatch(action);
  }

  static handleViewAction(action) {
    dispatcher.dispatch({
      source: "VIEW_ACTION",
      action: action
    });
  }

  static handleStoreAction(action) {
    dispatcher.dispatch({
      source: "STORE_ACTION",
      action: action
    });
  }
}
