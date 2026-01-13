// CRITICAL: Polyfills must be loaded FIRST before any other imports
import { Platform } from 'react-native';

// Polyfills for TensorFlow.js on React Native
if (Platform.OS !== 'web') {
  // URL polyfill - must be first
  require('react-native-url-polyfill/auto');
  
  // Fetch polyfill using whatwg-fetch
  require('whatwg-fetch');
  
  // Base64 encoding
  const { encode, decode } = require('base-64');
  if (!global.btoa) {
    global.btoa = encode;
    global.atob = decode;
  }
  
  // TextEncoder/TextDecoder
  const { TextEncoder, TextDecoder } = require('text-encoding');
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }
  
  // Performance polyfill
  if (typeof global.performance === 'undefined') {
    global.performance = {} as any;
  }
  if (typeof global.performance.now === 'undefined') {
    global.performance.now = () => Date.now();
  }
  
  console.log('✅ Polyfills loaded for React Native');
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
