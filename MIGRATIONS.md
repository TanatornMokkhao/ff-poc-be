# Database migrations: expand / contract

A rollback runs the **older** code on the **newer** schema. Migrations never run down. So every
migration must work with the release before it, and the release after it.

## The two kinds

| Kind | May do | Header |
|---|---|---|
| `expand` | Add a table, a nullable column, a column with a `DEFAULT`, an index | `-- kind: expand` |
| `contract` | Drop, rename, change a type, set `NOT NULL` | `-- kind: contract` and `-- removes-use-from: X.Y.Z` |

`removes-use-from` is the first release whose code no longer reads or writes what the contract
removes. The hub's rollback refuses to go below that release once the contract is in prod.

## A breaking change takes three releases

Example: rename `notes.body` to `notes.text`.

1. **Expand** (release 1.2.0): add `text`. Code writes both columns and reads `text`, falling back to `body`.
2. **Backfill**: copy `body` into `text` with a command, not a migration.
3. **Contract** (release 1.4.0, after 1.2.0 has been in prod long enough that nobody rolls back to 1.1.x):
   drop `body`, with `-- removes-use-from: 1.2.0`.

## Rules CI checks

`scripts/check-migrations.mjs` (job `migrations` in `.github/workflows/ci.yml`):

- Names are `NNNN_lower_snake.sql`, numbers unique, new files sort after every released file.
- An `expand` file has no `DROP`, `RENAME`, type change, `SET NOT NULL`, `NOT NULL` column without `DEFAULT`, `TRUNCATE` or `DELETE FROM`.
- A `contract` file names `removes-use-from`.
- A file in the last release tag never changes. Fix forward with a new file.

The same job applies the last release's migrations, then this change's, then starts **the last
release's code** on that schema (the rollback case) and this change's code, and checks both answer.

## Running

```bash
DATABASE_URL=postgres://… node migrate.js
```

Each file runs once, in its own transaction, and is recorded in `schema_migrations`.
Today no stage has a database: `DATABASE_URL` is optional and `/notes` answers 503 without it.
The deploy step that runs migrations (its own role and database user, before the new code starts)
comes with ECS and RDS.
