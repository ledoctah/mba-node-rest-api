import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { knex } from '../database';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const transactions = await knex('transactions')
        .select()
        .where('session_id', sessionId);

      return { transactions };
    },
  );

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const summary = await knex('transactions')
        .sum('amount', { as: 'amount' })
        .where('session_id', sessionId)
        .first();

      return { summary };
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getTransactionParamsSchema.parse(request.params);
      const { sessionId } = request.cookies;

      const transaction = await knex('transactions')
        .select()
        .where({
          id,
          session_id: sessionId,
        })
        .first();

      return { transaction };
    },
  );

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number().min(0),
      type: z.enum(['credit', 'debit']),
    });

    const body = createTransactionBodySchema.parse(request.body);

    const { title, amount, type } = body;

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });
}
