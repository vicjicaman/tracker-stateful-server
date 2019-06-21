import React from 'react';
import {renderToNodeStream, renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom';
import {getLoadableState} from 'loadable-components/server';
import {Provider} from 'react-redux';
import {ApolloProvider} from 'react-apollo';
import {all, fork} from 'redux-saga/effects';
import {getDataFromTree} from "react-apollo";

import {renderHeader, renderFooter} from './render.jsx';
import configureStore from './store.jsx';
import configureGraphClient from './graph.jsx';

const initState = ({reducers, url, req}) => {
  const {store} = configureStore({reducers, initState: {}});
  const {graph} = configureGraphClient({url, req, initState: {}});

  return {store, graph}
}

const renderHandler = async ({
  AppRoot,
  store,
  graph,
  watchers,
  res,
  routerContext,
  mounts,
  config
}, cxt) => {

  const {logger} = cxt;

  let loadableState = {};
  //loadableState = await getLoadableState(appWithRouter);;;;

  function* rootSaga() {
    yield all(watchers.map(saga => fork(saga)));
  }

  logger.info("Run initial/mount request saga");
  store.runSaga(rootSaga).done.then(() => {

    logger.info("Render graph data");
    getDataFromTree(AppRoot).then(() => {

      logger.info("Render store/graph to node stream");
      const preloadedState = store.getState();
      const htmlSteam = renderHeader({mounts}) + renderToString(AppRoot) + renderFooter({
        css: "",
        config,
        loadableState,
        preloadedState,
        preloadedGraphState: graph.extract(),
        mounts
      });

      if (routerContext.url) {
        res.redirect(routerContext.url);
      } else {
        res.status(200);
        res.send(htmlSteam);
      }

    }).catch(function(error) {
      console.log(error);
    });

  });

  loadableState = await getLoadableState(AppRoot);
  store.close();

}

export const RenderStateful = ({
  App,
  urls: {
    graphql,
    events
  },
  reducers,
  watchers,
  req,
  res,
  mounts
}, cxt) => {

  let routerContext = {};
  const {store, graph} = initState({reducers, url: graphql, req})

  const AppRoot = <ApolloProvider client={graph}>
    <Provider store={store}>
      <StaticRouter location={req.url} context={routerContext}>
        <App/>
      </StaticRouter>
    </Provider>
  </ApolloProvider>;

  renderHandler({
    AppRoot,
    watchers,
    res,
    routerContext,
    store,
    graph,
    config: {
      urls: {
        graphql,
        events
      }
    },
    mounts
  }, cxt)

}
