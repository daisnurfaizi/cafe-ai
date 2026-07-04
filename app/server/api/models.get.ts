import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { env } from '~~/server/utils/env';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });

  if (!session.data?.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized.',
    });
  }

  const configPath = path.resolve(process.cwd(), '../litellm_config.yaml');
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as any;
    
    // Only return safe public info (no api_key or api_base)
    const models = config.model_list.map((m: any) => ({
      name: m.model_name,
      input_cost_per_token: m.litellm_params.input_cost_per_token || 0,
      output_cost_per_token: m.litellm_params.output_cost_per_token || 0,
      status: 'Available', // Mock status for UI
    }));
    
    return models;
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to read models config' });
  }
});
