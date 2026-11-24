import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/env';
import dbPlugin from './plugins/db';
import { envToLogger } from './config/pino';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { corsOptions } from './config/cors';
import { rateLimitOptions } from './config/rate-limit';
import path from 'path';
import pointOfView from '@fastify/view';
import ejs from 'ejs';


import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { apiRoutes } from './routes';
import { getLanguageFromRequest, t } from './i18n';
import { recordRoute } from './routes/meta.routes';
import { ensureSchemaColumns } from './utils/schemaGuard';

export function buildApp(): FastifyInstance {
  const environment = process.env.NODE_ENV || 'production';
  const app = Fastify({
    logger: envToLogger[environment],
  });

  // Hook untuk mencatat semua endpoint yang didaftarkan ke Fastify
  app.addHook('onRoute', (routeOptions) => {
    const methods = Array.isArray(routeOptions.method) ? routeOptions.method : [routeOptions.method];
    for (const m of methods) {
      if (m !== 'HEAD' && m !== 'OPTIONS') {
        recordRoute({
          method: m,
          path: routeOptions.url,
          prefix: routeOptions.prefix,
        });
      }
    }
  });

  // Setup Zod Validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Database Plugin
  app.register(dbPlugin);
  app.register(sensible);

  // Register Security & Core Plugins
  app.register(helmet);
  app.register(cors, corsOptions);
  app.register(rateLimit, rateLimitOptions);
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB max (PDF up to 10MB, images checked in mediaService)
      files: 1,
    },
  });

  // Register View Engine
  app.register(pointOfView, {
    engine: {
      ejs: ejs,
    },
    root: path.join(__dirname, 'views'),
  });

  // Home Route using EJS
  app.get('/', async (request, reply) => {
    return reply.view('index.ejs', {
      title: 'Tijarah API',
      heading: '🚀 Tijarah API Berjalan!',
      message: 'Server backend ini dirender menggunakan template EJS.'
    });
  });

  // Health check route
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'Tijarah-3 Backend API',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    };
  });

  // Custom Global Error Handler untuk i18n Zod Validation Error
  app.setErrorHandler((error: any, request, reply) => {
    const lang = getLanguageFromRequest(request);

    // Fastify Validation Error (Zod)
    if (error.validation || error.name === 'ZodError') {
      const issues = error.issues || error.validation || [];
      const formattedErrors = Array.isArray(issues)
        ? issues.map((issue: any) => {
            const rawMsg = issue.message || issue.params?.issue?.message;
            return {
              field: Array.isArray(issue.path) ? issue.path.join('.') : issue.instancePath || 'unknown',
              message: t(rawMsg, {}, lang),
            };
          })
        : [];

      const firstMsg = formattedErrors[0]?.message || t('common.bad_request', {}, lang);

      return reply.code(400).send({
        status: 'error',
        message: firstMsg,
        errors: formattedErrors,
      });
    }

    return reply.send(error);
  });

  // Register Global API Routes
  app.register(apiRoutes, { prefix: '/api/v1' });

  app.addHook('onReady', async () => {
    await ensureSchemaColumns();
  });

  return app;
}

const app = buildApp();
export default app;
