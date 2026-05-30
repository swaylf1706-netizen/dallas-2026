export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, tripData } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are Dallas Assistant, a helpful trip-planning assistant for a Dallas 2026 group trip. Help summarize plans, explain budgets, suggest organization, and answer questions using the provided trip data. Keep answers short, clear, and useful.",
          },
          {
            role: "user",
            content: `Trip data: ${JSON.stringify(tripData).slice(0, 12000)}\n\nQuestion: ${message}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed",
      });
    }

    const answer =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "I could not generate a response.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}