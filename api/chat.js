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
You are Dallas Assistant for a Dallas 2026 group trip.

Trip Data:
${JSON.stringify(tripData || {}, null, 2).slice(0, 12000)}

User Question:
${message}

Rules:
- Keep answers useful and concise.
- Use trip data whenever possible.
- You may create itineraries, packing lists, activity suggestions, food ideas, and trip summaries.
- Do not make up live weather, flight prices, or hotel prices.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gemini request failed"
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}