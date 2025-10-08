// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add Node.js module resolution for packages that require them
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve Node.js built-in modules as empty objects for React Native
  if (moduleName === 'path' || moduleName === 'fs') {
    return {
      type: 'empty',
    };
  }

  // Use default resolver for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
