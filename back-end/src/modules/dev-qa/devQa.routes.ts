import { FastifyInstance } from 'fastify';
import { devQaController } from './devQa.controller';
import { requireNonProduction } from '@/utils/authGuard';

export async function devQaRoutes(route: FastifyInstance) {
  route.addHook('preHandler', requireNonProduction);

  route.get('/schemas', devQaController.getSchemas);
  route.post('/schemas', devQaController.createSchema);
  route.put('/schemas/:id', devQaController.updateSchema);
  route.delete('/schemas/:id', devQaController.deleteSchema);

  route.get('/bugs', devQaController.getBugs);
  route.post('/bugs', devQaController.createBug);
  route.patch('/bugs/batch', devQaController.batchUpdateBugs);
  route.patch('/bugs/:id', devQaController.updateBug);
  route.delete('/bugs/:id', devQaController.deleteBug);

  route.get('/recordings', devQaController.getRecordings);
  route.post('/recordings', devQaController.createRecording);
  route.delete('/recordings/:id', devQaController.deleteRecording);
}
