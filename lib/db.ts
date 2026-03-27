/**
 * Oracle Autonomous Database connection (wallet-based mTLS).
 *
 * Setup instructions:
 * 1. Download the wallet zip from OCI Console → Autonomous Database → DB Connection.
 * 2. Unzip it to a directory on the server (e.g. /app/wallet or ./wallet locally).
 * 3. Set ORACLE_WALLET_LOCATION to that directory path.
 * 4. Set ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECTION_STRING in your .env.local.
 *
 * The wallet directory must contain: cwallet.sso, ewallet.p12, tnsnames.ora,
 * sqlnet.ora, ojdbc.properties, etc.
 */

import oracledb from 'oracledb';

// oracledb in thin mode doesn't need a native client — use it unless you have
// specific thick-mode requirements (e.g. Advanced Queuing).
oracledb.initOracleClient; // no-op in thin mode; kept for explicitness

let pool: oracledb.Pool | null = null;

async function getPool(): Promise<oracledb.Pool> {
  if (pool) return pool;

  const walletLocation = process.env.ORACLE_WALLET_LOCATION;
  if (!walletLocation) throw new Error('ORACLE_WALLET_LOCATION is not set');
  if (!process.env.ORACLE_USER) throw new Error('ORACLE_USER is not set');
  if (!process.env.ORACLE_PASSWORD) throw new Error('ORACLE_PASSWORD is not set');
  if (!process.env.ORACLE_CONNECTION_STRING)
    throw new Error('ORACLE_CONNECTION_STRING is not set');

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING,
    walletLocation,
    walletPassword: process.env.ORACLE_WALLET_PASSWORD, // optional — only if wallet is password-protected
    poolMin: 1,
    poolMax: 4,
    poolIncrement: 1,
  });

  return pool;
}

/**
 * Execute a SQL statement and return the result.
 * The connection is checked back into the pool automatically.
 */
export async function query<T = oracledb.Result<unknown>>(
  sql: string,
  binds: oracledb.BindParameters = [],
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });
    return result;
  } finally {
    await conn.close();
  }
}

/**
 * Execute multiple statements in a single connection (e.g. for transactions).
 */
export async function withConnection<T>(
  fn: (conn: oracledb.Connection) => Promise<T>
): Promise<T> {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}
