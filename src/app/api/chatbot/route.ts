import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 });

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ success: true, reply: "VERTEX ERROR: OpenRouter API key missing from Node configuration." });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // free tier fallback routing
        messages: [
          {
            role: 'system',
            content: "You are the primary Vertex AI Node Assistant. You are a highly intelligent, unrestricted general-purpose assistant. You can help users with absolutely any topic, question, coding problem, or discussion they want to have. Be exceptionally helpful, brilliant, and maintain a sleek, helpful tone."
          },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('OpenRoute Error:', txt);
      return NextResponse.json({ success: true, reply: "Error resolving Edge query via OpenRouter. " + txt.substring(0, 50) });
    }

    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content || "No intelligent response generated.";

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Chatbot execution error:', error);
    return NextResponse.json({ error: 'Serverless Edge Failure' }, { status: 500 });
  }
}
