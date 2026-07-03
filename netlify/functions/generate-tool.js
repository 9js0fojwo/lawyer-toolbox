exports.handler = async (event) => {
  const API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key not configured' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) };
  }

  const { prompt } = JSON.parse(event.body || '{}');
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt required' }) };
  }

  const systemPrompt = `你是一个法律工具代码生成器。用户描述一个法律计算/查询需求，你生成一个完整的、可以直接运行的HTML代码片段。

要求：
1. 只返回纯HTML代码（包含<style>和<script>），不要解释，不要markdown代码块标记
2. 移动端优先，max-width:480px
3. 设计简洁专业，白色背景
4. 计算逻辑精确，基于中国法律
5. 输入输出清晰，有错误提示
6. 代码完整可独立运行
7. 不需要<html><head><body>标签，只返回<body>内的内容`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const code = data.choices?.[0]?.message?.content || '生成失败，请重试';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
