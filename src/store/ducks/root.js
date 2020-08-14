import { combineReducers } from 'redux';
import movies from './movies';
import toasts from './toasts';

const rootReducer = combineReducers({
  movies,
  toasts,
});

export default rootReducer;
