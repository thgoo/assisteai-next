import { createStore } from 'redux';
import { createWrapper } from 'next-redux-wrapper';
import reducer from './ducks/root';

let makeStore = () => createStore(reducer);

if (typeof window !== 'undefined') {
  makeStore = () => createStore(
    reducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );
}

export const wrapper = createWrapper(makeStore);
