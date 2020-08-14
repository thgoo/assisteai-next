// Actions
export const ACTIONS = {
  HIDE: 'toasts/HIDE',
  SHOW: 'toasts/SHOW',
};

// Reducer
const initialState = [];
export default function reducer(state = initialState, action = {}) {
  const { payload, type } = action;

  switch (type) {
    case ACTIONS.SHOW: {
      const toast = { ...payload };
      toast.id = Math.random().toString(36).substring(7);
      return [
        toast,
        ...state,
      ];
    }
    case ACTIONS.HIDE:
      return state.filter(toast => toast.id !== payload);
    default:
      return state;
  }
}

// actions
export const showToast = payload => ({
  type: ACTIONS.SHOW,
  payload,
});

export const hideToast = payload => ({
  type: ACTIONS.HIDE,
  payload,
});
