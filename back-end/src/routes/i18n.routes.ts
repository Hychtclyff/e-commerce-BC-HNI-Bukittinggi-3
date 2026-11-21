import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDictionary, getLanguageFromRequest, dictionaries } from '@/i18n';
import { responseUtil } from '@/utils/response';

export async function i18nRoutes(fastify: FastifyInstance) {
  fastify.get('/dictionary', async (request: FastifyRequest, reply: FastifyReply) => {
    const lang = getLanguageFromRequest(request);
    const query = request.query as any;

    if (query?.all === 'true' || query?.all === '1') {
      return responseUtil.success({
        reply,
        message: 'All dictionaries retrieved successfully',
        data: {
          supportedLanguages: Object.keys(dictionaries),
          currentLanguage: lang,
          dictionaries,
        },
      });
    }

    const dict = getDictionary(lang);
    return responseUtil.success({
      reply,
      message: 'Dictionary retrieved successfully',
      data: {
        language: lang,
        dictionary: dict,
      },
    });
  });
}
