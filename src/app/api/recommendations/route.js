import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request) {
  try {
    const { allSheetsData, platformContext } = await request.json();

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY belum diset di .env.local' },
        { status: 500 }
      );
    }

    const prompt = `Kamu adalah ahli Digital Marketing, SEO, dan Google Analytics dengan pengalaman 10+ tahun.

Berdasarkan data Google Analytics berikut, berikan rekomendasi yang SPESIFIK dan ACTIONABLE untuk meningkatkan performa platform.

${allSheetsData}

${platformContext ? `Konteks platform: ${platformContext}` : ''}

Berikan TEPAT 6-8 rekomendasi dalam format JSON array berikut (HANYA JSON, tanpa teks lain):
[
  {
    "category": "audience|content|technical|growth|regional|attention",
    "priority": "high|medium|low",
    "title": "Judul rekomendasi singkat",
    "insight": "Apa yang data tunjukkan (gunakan angka spesifik dari data)",
    "recommendation": "Apa yang harus dilakukan",
    "expectedImpact": "Estimasi dampak jika dijalankan",
    "actionSteps": ["Langkah 1", "Langkah 2", "Langkah 3"]
  }
]

Pastikan:
1. Setiap rekomendasi menggunakan ANGKA SPESIFIK dari data
2. Action steps harus KONKRET dan bisa langsung dikerjakan
3. Minimal 2 rekomendasi priority "high"
4. Cover semua aspek: audience, content, technical, growth
5. Berikan rekomendasi dalam Bahasa Indonesia
6. Expected impact harus realistis`;

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

    let responseText = result.response.text();

    // Clean up response - extract JSON
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const recommendations = JSON.parse(responseText);
      return NextResponse.json({ recommendations });
    } catch {
      // If JSON parsing fails, try to find JSON array in response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ recommendations });
      }
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations: ' + error.message },
      { status: 500 }
    );
  }
}
