/*jshint esnext: true*/

import {Dispatcher} from "./ext/bower_components/flux/dist/Flux";

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
            source: 'VIEW_ACTION',
            action: action
        });
    }
}
