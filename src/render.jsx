import fs from 'fs';

const renderManifest = (mount, manifest, mode) => {
  let res = '';
  for (const key in manifest) {
    const file = manifest[key];
    if (key.endsWith('js') && mode === 'js') {
      res += '<script src="/mounts/' + mount + '/' + file + '"></script>\n';
    }

    if (key.endsWith('css') && mode === 'css') {
      res += '<link rel="stylesheet" href="/mounts/' + mount + '/' + file + '"/>\n';
    }
  }
  return res;
}

export const renderHeader = ({mounts}) => {

  let mountRes = '';
  for (const m in mounts) {
    const {manifest} = mounts[m];
    mountRes += renderManifest(m, manifest, 'css');
  }

  return `<!DOCTYPE html>
    <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Repoflow</title>
            ` + mountRes + `
        </head>
        <body>
            <div id="root">
`
};

export const renderFooter = ({
  css,
  config,
  loadableState,
  preloadedState,
  preloadedGraphState,
  mounts
}) => {

  let res = `
</div>`;
  res += loadableState.getScriptTag();
  res += `<script>
                // WARNING: See the following for security issues around embedding JSON in HTML!:
                // http://redux.js.org/docs/recipes/ServerRendering.html#security-considerations
                window.__CONFIG__ = ${JSON.stringify(config).replace(/</g, '\\u003c')}
                window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
                window.__APOLLO_STATE__ =  ${JSON.stringify(preloadedGraphState).replace(/</g, '\\u003c')}
            </script>
            <style id="jss-server-side">${css}</style>`; //+JSON.stringify(CoreAppManifest)+JSON.stringify(ResourcesManifest);

  for (const m in mounts) {
    const {manifest} = mounts[m];
    res += renderManifest(m, manifest, 'js');
  }

  res += `

        </body>
    </html>
`;
  return res;
};
