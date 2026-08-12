exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users 
    ADD COLUMN stripe_customer_id TEXT UNIQUE,
    ADD COLUMN subscription_status TEXT DEFAULT 'none';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users 
    DROP COLUMN stripe_customer_id,
    DROP COLUMN subscription_status;
  `);
};
