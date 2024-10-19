import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { knex } from '../database';

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const transactions = await knex('transactions').select();

    return { transactions };
  });

  app.get('/:id', async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const params = getTransactionParamsSchema.parse(request.params);

    const transaction = await knex('transactions')
      .select()
      .where({
        id: params.id,
      })
      .first();

    return { transaction };
  });

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number().min(0),
      type: z.enum(['credit', 'debit']),
    });

    const body = createTransactionBodySchema.parse(request.body);

    const { title, amount, type } = body;

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
    });

    return reply.status(201).send();
  });
}
