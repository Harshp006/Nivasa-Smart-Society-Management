const epModule = require('embedded-postgres');
const EmbeddedPostgres = epModule.default || epModule;
const path = require('path');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function start() {
  const isRunning = await checkPort(5432);
  if (isRunning) {
    console.log('✓ PostgreSQL is already running on port 5432.');
    setInterval(() => {}, 1000 * 60 * 60);
    return;
  }

  const dbDir = path.resolve(__dirname, '../.db-data');
  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
  });

  console.log('[DB] Initializing PostgreSQL cluster (UTF-8)...');
  try {
    await pg.initialise();
  } catch (err) {
    // If already initialized, ignore
  }

  console.log('[DB] Starting PostgreSQL on port 5432...');
  await pg.start();
  console.log('[DB] PostgreSQL server running on port 5432.');

  try {
    await pg.createDatabase('nivasa_db');
    console.log('[DB] Verified database: nivasa_db exists.');
  } catch (err) {
    // Already exists
  }

  console.log('[DB] PostgreSQL is fully online and ready for connections.');

  const shutdown = async () => {
    console.log('\n[DB] Stopping PostgreSQL server...');
    try {
      await pg.stop();
      console.log('[DB] PostgreSQL stopped cleanly.');
    } catch (e) {
      // ignore
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGHUP', shutdown);
}

start().catch((err) => {
  console.error('[DB] Failed to start PostgreSQL:', err);
  process.exit(1);
});
