exports.up = (pgm) => {
  // Clear existing mock data to avoid constraint issues with new auth requirements
  pgm.sql(`
    DELETE FROM run_memory;
    DELETE FROM steps;
    DELETE FROM runs;
    DELETE FROM tasks;
    DELETE FROM agents;
    DELETE FROM users;
  `);

  // Add password_hash column to users table
  pgm.sql(`
    ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN password_hash;
  `);
};
