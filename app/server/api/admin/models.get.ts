import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

export default defineEventHandler(async (event) => {
  const configPath = path.resolve(process.cwd(), '../litellm_config.yaml');
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as any;
    
    const models = config.model_list.map((m: any) => ({
      name: m.model_name,
      model: m.litellm_params.model,
      api_base: m.litellm_params.api_base,
      api_key: m.litellm_params.api_key,
      input_cost_per_token: m.litellm_params.input_cost_per_token || 0,
      output_cost_per_token: m.litellm_params.output_cost_per_token || 0,
    }));
    
    return models;
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to read config' });
  }
});
