// Ensure tests use a temporary database directory to avoid collisions
process.env.NB_BACKEND_DB_DIRECTORY = './databases';
// Disable seeding during tests unless a test explicitly calls it
process.env.NB_BACKEND_NODE_ENV = process.env.NB_BACKEND_NODE_ENV || 'test';
