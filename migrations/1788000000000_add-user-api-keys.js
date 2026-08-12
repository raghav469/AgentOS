exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
    ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS gemini_api_key,
    DROP COLUMN IF EXISTS openai_api_key;
  `);
};
