import { AgentConfig } from '../models/index.js';

export async function getAgentConfig(req, res, next) {
  try {
    const { dept, semester, section } = req.tenant;
    const config = await AgentConfig.findById(`${dept}:${semester}:${section}`).lean();
    res.json(config || {
      dept, semester, section,
      model_name: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      api_base_url: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      system_prompt: '',
      has_custom_key: false,
    });
  } catch (e) { next(e); }
}

export async function updateAgentConfig(req, res, next) {
  try {
    const { dept, semester, section } = req.tenant;
    const { api_base_url, api_key, model_name, system_prompt } = req.body;

    const doc = {
      _id: `${dept}:${semester}:${section}`,
      dept, semester, section,
      api_base_url: api_base_url || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model_name: model_name || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      system_prompt: system_prompt || '',
      updated_at: new Date(),
    };
    if (api_key) doc.api_key = api_key;

    const saved = await AgentConfig.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true }).lean();
    res.json({ ok: true, config: saved });
  } catch (e) { next(e); }
}
