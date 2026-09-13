import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request) {
  try {
    const { prompt, dataContext, chatHistory } = await request.json();

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY belum diset di .env.local' },
        { status: 500 }
      );
    }

    const systemPrompt = `Kamu adalah AI analytics assistant bernama "InsightKuy AI".
Kamu membantu user menganalisis data dari file Excel mereka (biasanya Google Analytics export).

Data yang tersedia saat ini:
${dataContext}

Instruksi:
- Jawab dalam bahasa yang sama dengan pertanyaan user
- Berikan insight yang SPESIFIK dan ACTIONABLE berdasarkan data
- Gunakan angka dan persentase dari data yang SEBENARNYA
- Format jawaban dengan markdown (heading, bullet points, bold) agar mudah dibaca
- Jika ditanya tentang data yang tidak tersedia, jelaskan data apa saja yang kamu punya
- Berikan konteks dan interpretasi, bukan hanya angka mentah`;

    // Build chat history
    const contents = [];

    // Add system prompt as first user message
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Saya siap membantu menganalisis data kamu. Silakan tanyakan apa saja!' }],
    });

    // Add previous chat history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      });
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let result = null;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent({ contents });
        if (result) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error('Gagal memanggil Gemini API');
    }

    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response: ' + error.message },
      { status: 500 }
    );
  }
}
