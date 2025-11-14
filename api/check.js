export default async function handler(req, res) {
  // CORS for Netlify frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = (req.query.email || "").trim();
  if (!email) return res.status(400).json({ error: "Missing email parameter" });

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = "email-breach-search.p.rapidapi.com";

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({
      error: "Missing RAPIDAPI_KEY in server environment variables",
    });
  }

  try {
    const url = `https://${RAPIDAPI_HOST}/rapidapi/search-email/${encodeURIComponent(
      email
    )}`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("Upstream error:", upstream.status, data);
      return res.status(upstream.status).json({
        error: data.message || "Upstream breach service error",
        status: upstream.status,
      });
    }

    // detect breach count based on API shape
    let breachCount = 0;

    if (Array.isArray(data?.breaches)) {
      breachCount = data.breaches.length;
    } else if (Array.isArray(data)) {
      breachCount = data.length;
    } else if (typeof data.breach_count === "number") {
      breachCount = data.breach_count;
    }

    return res.status(200).json({
      email,
      pwned: breachCount > 0,
      breach_count: breachCount,
      raw: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
