import OpenAI from 'openai';
import { studentTools, adminTools } from '../agent/tools.js';
import { runTool } from '../agent/executor.js';
import { systemPrompt } from '../agent/prompt.js';
import { AgentConfig } from '../models/index.js';

const MAX_STEPS = 6;

export async function getClientAndConfig(tenant) {
  let apiKey = process.env.OPENROUTER_API_KEY;
  let baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  let model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  let customSystemPrompt = '';

  if (tenant && tenant.dept && tenant.semester && tenant.section) {
    const config = await AgentConfig.findById(`${tenant.dept}:${tenant.semester}:${tenant.section}`).lean();
    if (config) {
      if (config.api_key) apiKey = config.api_key;
      if (config.api_base_url) baseURL = config.api_base_url;
      if (config.model_name) model = config.model_name;
      if (config.system_prompt) customSystemPrompt = config.system_prompt;
    }
  }

  if (!apiKey) return { client: null, model, customSystemPrompt };

  const client = new OpenAI({ baseURL, apiKey });
  return { client, model, customSystemPrompt };
}

export async function handleChat(req, res) {
  const tenant = req.tenant || { dept: 'CSE', semester: '4.1', section: 'B' };
  const user = req.user || { role: 'student', student_name: 'Sakibul Hassan', student_id: '20-40532', ...tenant };

  const { client, model, customSystemPrompt } = await getClientAndConfig(tenant);
  if (!client) {
    return res.status(503).json({
      error: 'Agent unavailable: set OPENROUTER_API_KEY in server/.env or configure in Section Settings. The dashboard works without it.',
    });
  }

  // Structural Tool Permission Partitioning (Section 5 Architecture)
  const activeTools = user.role === 'admin' ? adminTools : studentTools;

  const userMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
  const basePrompt = systemPrompt();
  
  // Non-overridable safety wrapper appended to custom prompt
  const safetyWrapper = user.role === 'admin'
    ? `\nRole: You are acting as Administrator for ${tenant.dept} ${tenant.semester} Section ${tenant.section}. You have tools to read, create, edit, delete, and book.`
    : `\nRole: You are acting as Student Assistant for ${tenant.dept} ${tenant.semester} Section ${tenant.section}. You only have read tools and event registration. You cannot modify schedules, announcements, assignments, or delete records.`;

  const fullSystemPrompt = customSystemPrompt
    ? `${basePrompt}\n\nSection Instructions:\n${customSystemPrompt}\n${safetyWrapper}`
    : `${basePrompt}\n${safetyWrapper}`;

  const messages = [{ role: 'system', content: fullSystemPrompt }, ...userMessages];
  const trace = [];

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const completion = await client.chat.completions.create({
        model,
        messages,
        tools: activeTools,
        tool_choice: 'auto',
        temperature: 0.2,
      });

      const msg = completion.choices[0].message;
      messages.push(msg);

      const calls = msg.tool_calls || [];
      if (calls.length === 0) {
        return res.json({ reply: msg.content || '', trace, messages: messages.slice(1) });
      }

      for (const call of calls) {
        let args = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* leave {} */ }
        const result = await runTool(call.function.name, args, { user, tenant });
        trace.push({ tool: call.function.name, args, result });
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    return res.json({
      reply: "I couldn't finish that in a reasonable number of steps. Could you rephrase or narrow the request?",
      trace, messages: messages.slice(1),
    });
  } catch (e) {
    console.error('[chatController.handleChat] error:', e);
    return res.status(500).json({ error: e.message || 'Agent error', trace });
  }
}
