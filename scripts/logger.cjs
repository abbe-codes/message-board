/// Centralized logger for Node.js scripts in this workspace.
/* eslint-disable no-console */

function formatMessage(namespace, message) {
  const prefix = namespace ? `[${namespace}]` : '';

  if (typeof message === 'string') {
    return prefix ? `${prefix} ${message}` : message;
  }

  try {
    return `${prefix} ${JSON.stringify(message)}`;
  } catch {
    return `${prefix} ${String(message)}`;
  }
}

function createLogger(options = {}) {
  const namespace = options.namespace;

  return {
    debug(message, ...optionalParams) {
      console.debug(formatMessage(namespace, message), ...optionalParams);
    },
    info(message, ...optionalParams) {
      console.info(formatMessage(namespace, message), ...optionalParams);
    },
    warn(message, ...optionalParams) {
      console.warn(formatMessage(namespace, message), ...optionalParams);
    },
    error(message, ...optionalParams) {
      console.error(formatMessage(namespace, message), ...optionalParams);
    },
  };
}

const logger = createLogger();

module.exports = { logger, createLogger };

