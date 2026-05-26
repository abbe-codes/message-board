export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  namespace?: string;
}

function formatMessage(namespace: string | undefined, message: unknown): string {
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

export function createLogger(options: LoggerOptions = {}) {
  const { namespace } = options;

  return {
    debug(message: unknown, ...optionalParams: unknown[]) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage(namespace, message), ...optionalParams);
    },
    info(message: unknown, ...optionalParams: unknown[]) {
      // eslint-disable-next-line no-console
      console.info(formatMessage(namespace, message), ...optionalParams);
    },
    warn(message: unknown, ...optionalParams: unknown[]) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage(namespace, message), ...optionalParams);
    },
    error(message: unknown, ...optionalParams: unknown[]) {
      // eslint-disable-next-line no-console
      console.error(formatMessage(namespace, message), ...optionalParams);
    },
  };
}

export const logger = createLogger();

