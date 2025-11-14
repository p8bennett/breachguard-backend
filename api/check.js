// api/check.js

export default async function handler(req, res) {
  // CORS headers – allow your Netlify site to call this API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight (browser "test" request)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get the email from the query string
  const { email } = req.query;

  // Simple demo response – this is the fake data for now
  return res.status(200).json({
    email: email || "unknown@example.com",
    pwned: true,
    breach_count: 3,
    message: "Test API endpoint working (with CORS)!"
  });
}
