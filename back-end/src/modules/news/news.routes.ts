import { FastifyInstance } from 'fastify';
import { newsController } from './news.controller';

export const newsRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/', newsController.list);
  fastify.get('/:id', newsController.getById);
  fastify.post('/', newsController.create);
  fastify.put('/:id', newsController.update);
  fastify.delete('/:id', newsController.remove);
};