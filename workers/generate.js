// Awen Music — Cloudflare Worker: 万能 AI 代理
//
// 环境变量（在 Cloudflare Worker → Settings → Variables 里设置）：
//   PROVIDER      : "anthropic" 或 "openai"（默认 openai，兼容 DeepSeek/MiMo/通义等）
//   UPSTREAM_URL  : API 地址
//                   - DeepSeek : https://api.deepseek.com/v1/chat/completions
//                   - MiMo     : https://api.mimo.ai/v1/chat/completions  (按实际填)
//                   - 通义     : https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
//                   - Anthropic: https://api.anthropic.com/v1/messages
//   UPSTREAM_KEY  : 对应平台的 API Key
//   MODEL         : 模型名，例如 deepseek-chat / MiMo-7B-RL / qwen-turbo / claude-haiku-4-5-20251001

const ALLOWED_ORIGINS = [
  'https://hiawen.com',
  'https://awenstudio.github.io',
  'http://localhost:8771',
  'http://localhost:8770',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let prompt;
    try {
      const body = await request.json();
      prompt = body?.prompt;
    } catch {
      return new Response(JSON.stringify({ error: 'invalid json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'missing prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const provider = (env.PROVIDER || 'openai').toLowerCase();
    const url     = env.UPSTREAM_URL;
    const key     = env.UPSTREAM_KEY;
    const model   = env.MODEL;

    if (!url || !key || !model) {
      return new Response(JSON.stringify({ error: 'Worker env vars not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // 密码校验：有设置 ACCESS_TOKEN 时才验证
    if (env.ACCESS_TOKEN) {
      const token = request.headers.get('X-Access-Token') || '';
      if (token !== env.ACCESS_TOKEN) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }
    }

    // 根据 provider 构造不同格式的请求体和请求头
    let headers, body;

    if (provider === 'anthropic') {
      // Anthropic 自有格式
      headers = {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      };
      body = JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
    } else {
      // OpenAI 兼容格式（DeepSeek / MiMo / 通义 / Kimi 等）
      headers = {
        'Authorization': `Bearer ${key}`,
        'content-type': 'application/json',
      };
      body = JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
    }

    const r = await fetch(url, { method: 'POST', headers, body });

    if (!r.ok) {
      const err = await r.text();
      return new Response(JSON.stringify({ error: 'upstream failed', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const data = await r.json();

    // 统一提取 text：Anthropic 和 OpenAI 的响应结构不同
    const text = provider === 'anthropic'
      ? (data?.content?.[0]?.text ?? '')
      : (data?.choices?.[0]?.message?.content ?? '');

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
