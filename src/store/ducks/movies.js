import { HYDRATE } from 'next-redux-wrapper';

// types
export const TYPES = {
  ADD_MOVIES: 'movies/ADD_MOVIES',
};

// reducer
const initialState = {
  visible: [],
};
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case HYDRATE: {
      if (state) return state;

      return {
        ...state,
        ...action?.payload?.movies,
      };
    }
    case TYPES.ADD_MOVIES:
      return state; // @TODO
    default:
      return state;
  }
}

// actions
export const setUser = movies => ({
  type: TYPES.ADD_MOVIES,
  payload: movies,
});
