import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
    getCreditAccountSchema,
    getCreditLedgerSchema,
    applyCreditSchema,
    getApplicationsSchema,
    approveApplicationSchema,
    rejectApplicationSchema,
} from './credit.schema';
import { creditController } from './credit.controller';

export async function creditRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // --- CLIENT / USER ENDPOINTS ---

    server.get(
        '/account',
        getCreditAccountSchema,
        creditController.getCreditAccount
    );

    server.get(
        '/account/:userId',
        getCreditAccountSchema,
        creditController.getCreditAccount
    );

    server.post(
        '/apply',
        applyCreditSchema,
        creditController.applyCredit
    );

    server.get(
        '/ledger',
        getCreditLedgerSchema,
        creditController.getCreditLedger
    );

    server.get(
        '/ledger/:userId',
        getCreditLedgerSchema,
        creditController.getCreditLedger
    );

    // --- ADMIN BACK-OFFICE ENDPOINTS ---

    server.get(
        '/admin/applications',
        getApplicationsSchema,
        creditController.getApplications
    );

    server.patch(
        '/admin/applications/:id/approve',
        approveApplicationSchema,
        creditController.approveApplication
    );

    server.patch(
        '/admin/applications/:id/reject',
        rejectApplicationSchema,
        creditController.rejectApplication
    );
}
