import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request) {
  try {
    const { datasetA, datasetB, question } = await request.json();

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY belum diset di .env.local' },
        { status: 500 }
      );
    }

    const prompt = `Kamu adalah data analyst. Bandingkan dua dataset berikut:

=== DATASET A ===
${datasetA}

=== DATASET B ===
${datasetB}

${question ? `Pertanyaan user: ${question}` : 'Berikan perbandingan menyeluruh antara kedua dataset.'}

Berikan analisis perbandingan yang meliputi:
1. **Perbedaan utama** antara kedua dataset
2. **Tren** yang terlihat dari perbandingan
3. **Insight** yang bisa diambil
4. **Rekomendasi** berdasarkan perbandingan

Gunakan angka spesifik dan persentase perubahan. Format dengan markdown.`;

    const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let result = null;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
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
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: 'Failed to compare: ' + error.message },
      { status: 500 }
    );
  }
}
