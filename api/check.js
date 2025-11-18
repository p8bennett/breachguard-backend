// api/check.js
// REAL RapidAPI breach lookup — production-ready

export default async function handler(req, res) {
  // --- CORS (same as before) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET for now (your frontend uses GET)
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Get email ---
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // --- ENV VARS ---
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
  const RAPIDAPI_BASE = process.env.RAPIDAPI_BASE_URL;

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST || !RAPIDAPI_BASE) {
    return res.status(500).json({
      error: "Missing RapidAPI credentials on server.",
    });
  }

  // --- Build the RapidAPI URL ---
  // NOTE: Replace "/breachedaccount/" with YOUR exact endpoint from RapidAPI
  const url = `${RAPIDAPI_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`;

  try {
    // --- CALL RapidAPI ---
    const upstreamRes = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    const text = await upstreamRes.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    // --- Handle "no breach found" case ---
    if (upstreamRes.status === 404) {
      return res.status(200).json({
        email,
        pwned: false,
        breach_count: 0,
        breaches: [],
        message: "No breaches found.",
      });
    }

    // --- Handle error responses ---
    if (!upstreamRes.ok) {
      return res.status(502).json({
        error: "Error from RapidAPI.",
        status: upstreamRes.status,
        raw: json,
      });
    }

    // --- SUCCESS ---
    return res.status(200).json({
      email,
      pwned: true,
      breach_count: json.length || 1,
      breaches: json,
      message: "Live breach data fetched successfully.",
    });

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}
