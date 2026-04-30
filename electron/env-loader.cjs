const fs = require('fs');
const path = require('path');

function parseEnvFile(content) {
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const env = parseEnvFile(fs.readFileSync(filePath, 'utf8'));
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return true;
}

function loadFocusOrangeEnv(paths) {
  const loadedPaths = [];

  for (const filePath of paths) {
    if (loadEnvFile(filePath)) {
      loadedPaths.push(filePath);
    }
  }

  return loadedPaths;
}

function getEnvCandidatePaths({ appPath, userDataPath }) {
  return [
    path.join(userDataPath, '.env.local'),
    path.join(process.cwd(), '.env.local'),
    path.join(appPath, '.env.local'),
  ];
}

module.exports = {
  getEnvCandidatePaths,
  loadFocusOrangeEnv,
  parseEnvFile,
};
