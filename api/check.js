// api/check.js
// Real breach lookup using RapidAPI "email-breach-search"

export default async function handler(req, res) {
  // --- CORS: allow your Netlify site to call this API ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    // If env var isn’t set, fail gracefully
    return res.status(500).json({
      error: "Server not configured (missing RAPIDAPI_KEY)",
    });
  }

  try {
    const url = `https://email-breach-search.p.rapidapi.com/rapidapi/search-email/${encodeURIComponent(
      email
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "email-breach-search.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("RapidAPI error:", response.status, text);

      return res.status(502).json({
        error: "Upstream breach service error",
        status: response.status,
      });
    }

    const data = await response.json();

    // Try to infer the breaches list from the response shape
    const breaches =
      Array.isArray(data) ? data :
      Array.isArray(data.results) ? data.results :
      Array.isArray(data.breaches) ? data.breaches :
      [];

    const breachCount = breaches.length;

    return res.status(200).json({
      email,
      pwned: breachCount > 0,
      breach_count: breachCount,
      breaches_preview: breaches.slice(0, 3), // small sample for future UI
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error talking to breach API" });
  }
}
