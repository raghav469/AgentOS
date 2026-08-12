import { getLLMClient } from './src/llm';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const llm = getLLMClient();
  const res = await llm.generate('please create a task for me to go buy groceries', []);
  console.log(res);
}
run();
