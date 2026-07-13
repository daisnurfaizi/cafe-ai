import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { exec } from 'child_process';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { models } = body; // array of models
  
  if (!models || !Array.isArray(models)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const configPath = path.resolve(process.cwd(), '../litellm_config.yaml');
  
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as any;
    
    // Update model list
    config.model_list = models.map((m: any) => ({
      model_name: m.name,
      litellm_params: {
        model: m.model,
        api_base: m.api_base,
        api_key: m.api_key || 'sk-b0ce03d0d8a6fd77-uj0lyj-63339620',
        input_cost_per_token: Number(m.input_cost_per_token),
        output_cost_per_token: Number(m.output_cost_per_token),
      }
    }));
    
    const newYaml = yaml.dump(config);
    fs.writeFileSync(configPath, newYaml, 'utf8');
    
    // Restart LiteLLM container to apply changes
    exec('docker restart cafe-litellm', { cwd: path.resolve(process.cwd(), '..') });
    
    return { success: true };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to write config: ' + err.message });
  }
});
