exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE agents (
      id UUID PRIMARY KEY,
      user_id UUID,
      name TEXT,
      system_prompt TEXT,
      allowed_tools TEXT[],
      max_steps INT DEFAULT 10,
      model TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE runs (
      id UUID PRIMARY KEY,
      agent_id UUID REFERENCES agents(id),
      input_task TEXT,
      status TEXT,
      current_step INT,
      total_cost_usd NUMERIC,
      total_tokens INT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      finished_at TIMESTAMPTZ
    );

    CREATE TABLE steps (
      id UUID PRIMARY KEY,
      run_id UUID REFERENCES runs(id),
      step_number INT,
      phase TEXT,
      model_output JSONB,
      tool_name TEXT NULL,
      tool_input JSONB NULL,
      tool_output JSONB NULL,
      tokens_in INT,
      tokens_out INT,
      cost_usd NUMERIC,
      latency_ms INT,
      retry_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE run_memory (
      id UUID PRIMARY KEY,
      agent_id UUID REFERENCES agents(id),
      run_id UUID REFERENCES runs(id),
      summary TEXT,
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS run_memory;
    DROP TABLE IF EXISTS steps;
    DROP TABLE IF EXISTS runs;
    DROP TABLE IF EXISTS agents;
    DROP EXTENSION IF EXISTS vector;
  `);
};
