export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message, tripData } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel" });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `You are Dallas Assistant for a Dallas 2026 trip app.
Use this trip data to answer shortly and clearly:
${JSON.stringify(tripData || {}).slice(0, 12000)}

User question: ${message}`,
      }),
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: data.error?.message || "OpenAI request failed",
      });
    }

    return res.status(200).json({
      answer: data.output_text || "I could not generate a response.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}