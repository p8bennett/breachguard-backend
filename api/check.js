// api/check.js
// Direct Have I Been Pwned API integration (no RapidAPI middleman)

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Get email ---
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // --- Get HIBP API Key from environment ---
  const HIBP_API_KEY = process.env.HIBP_API_KEY;

  if (!HIBP_API_KEY) {
    return res.status(500).json({
      error: "Missing HIBP API key on server.",
    });
  }

  // --- Build HIBP URL ---
  // truncateResponse=false gives us FULL breach details (name, description, breach date, compromised data types)
  const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;

  try {
    // --- Call HIBP directly ---
    const upstreamRes = await fetch(url, {
      method: "GET",
      headers: {
        "hibp-api-key": ef939cc48af04a318a880cef172dbd0f,
        "user-agent": "EmailBreachGuard-BreachChecker",
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
        message: "Good news! No breaches found for this email.",
      });
    }

    // --- Handle rate limiting (429) ---
    if (upstreamRes.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment and try again.",
        retry_after: upstreamRes.headers.get("retry-after"),
      });
    }

    // --- Handle other error responses ---
    if (!upstreamRes.ok) {
      return res.status(502).json({
        error: "Error from HIBP API.",
        status: upstreamRes.status,
        raw: json,
      });
    }

    // --- SUCCESS ---
    // HIBP returns an array of breach objects with full details
    return res.status(200).json({
      email,
      pwned: true,
      breach_count: Array.isArray(json) ? json.length : 1,
      breaches: json,
      message: "Breach data retrieved successfully.",
    });

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({
      error: "Internal server error.",
      details: err.message,
    });
  }
}
