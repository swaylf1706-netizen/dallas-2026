export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message, tripData } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel" });
    }

    const prompt = `
You are Dallas Assistant, a helpful AI assistant inside a Dallas 2026 group trip planning app.

Use the trip data below when possible:
${JSON.stringify(tripData || {}).slice(0, 12000)}

User question:
${message}

Rules:
- Keep answers short and useful.
- If the question asks about exact app data like who owes money, final picks, confirmed people, or expenses, use the provided trip data.
- If the question asks for ideas, suggestions, itineraries, packing lists, or planning help, give helpful Dallas trip advice.
- Do not pretend to know live weather or live prices.
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data.error?.message || "Gemini request failed",
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I could not generate a response.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}