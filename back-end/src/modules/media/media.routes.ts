import { FastifyInstance } from 'fastify';
import { mediaController } from './media.controller';

export async function mediaRoutes(route: FastifyInstance) {
  route.post('/upload', mediaController.upload);
  route.get('/', mediaController.list);
  route.get('/:id/url', mediaController.getUrl);
  route.delete('/:id', mediaController.remove);
}
