import type { FastifyLoggerOptions } from 'fastify';
import type { LoggerOptions } from 'pino';

type EnvironmentLoggers = Record<string, (FastifyLoggerOptions & LoggerOptions) | boolean>;

export const envToLogger: EnvironmentLoggers = {
    development: {
        transport: {
            target: 'pino-pretty',
            options: {
                singleLine: false,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
        level: 'debug',
    },
    production: {
        level: 'info',
    },
    test: false,
};