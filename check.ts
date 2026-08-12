import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const { rows } = await pool.query("SELECT * FROM steps WHERE run_id = '4f96dc8b-119a-411d-b6ea-7f3b557616c8' ORDER BY step_number ASC");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err: any) {
    console.error(err.message);
  }
  process.exit(0);
}
run();
