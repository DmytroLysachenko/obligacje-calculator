import { randomUUID } from 'node:crypto';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration('reviewed PostgreSQL migrations', () => {
  let sql: Sql;

  beforeAll(async () => {
    sql = postgres(databaseUrl!, { max: 1 });
    await migrate(drizzle(sql), { migrationsFolder: 'drizzle' });
  });

  afterAll(async () => {
    await sql.end({ timeout: 2 });
  });

  it('enforces share retention and financial amount constraints in PostgreSQL', async () => {
    await expect(
      sql`
        insert into shared_single_scenarios (id, share_id, title, payload_json, expires_at)
        values (${randomUUID()}, ${randomUUID()}, ${'   '}, ${'{}'}, ${new Date()})
      `,
    ).rejects.toThrow();

    await expect(
      sql`
        insert into user_investment_lots (id, portfolio_id, bond_type, purchase_date, amount)
        values (${randomUUID()}, ${randomUUID()}, ${'EDO'}, ${'2026-01-01'}, ${'-1'})
      `,
    ).rejects.toThrow();
  });

  it('rolls back a multi-write transaction against the migrated schema', async () => {
    const title = `rollback-${randomUUID()}`;

    await expect(
      sql.begin(async (transaction) => {
        await transaction.unsafe(
          'insert into shared_single_scenarios (id, share_id, title, payload_json, expires_at) values ($1, $2, $3, $4, $5)',
          [randomUUID(), randomUUID(), title, '{}', new Date(Date.now() + 60_000)],
        );
        throw new Error('intentional rollback');
      }),
    ).rejects.toThrow('intentional rollback');

    const rows = await sql<{ count: string }[]>`
      select count(*)::text as count from shared_single_scenarios where title = ${title}
    `;
    expect(rows[0]?.count).toBe('0');
  });
});
