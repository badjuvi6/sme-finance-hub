import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App).
// It also ensures that whether you load the app in Expo Go, a dev client, or a
// standalone production build, the environment is set up appropriately.
//
// If package.json's "main" field ever points anywhere else (e.g. was left as
// "node_modules/expo/AppEntry.js" from an old template, or was edited by hand),
// this file — and App.js itself — is never even reached, and the app crashes
// before a single React component renders. Keep "main": "index.js" in package.json
// pointed at this exact file.
registerRootComponent(App);