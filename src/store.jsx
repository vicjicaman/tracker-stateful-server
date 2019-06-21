import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import createSagaMiddleware, {END} from 'redux-saga';
import createMemoryHistory from 'history/createMemoryHistory';
import {routerMiddleware} from 'react-router-redux';

export default({reducers, initialState}) => {

  const sagaMiddleware = createSagaMiddleware();

  const reduxMiddlewares = [
    routerMiddleware(createMemoryHistory()),
    sagaMiddleware
  ];

  const store = createStore(combineReducers({app:reducers}), initialState, compose(applyMiddleware(...reduxMiddlewares)),);

  store.runSaga = sagaMiddleware.run;
  store.close = () => store.dispatch(END);

  return {store};
};
