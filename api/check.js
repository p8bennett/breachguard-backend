export default async function handler(req, res) {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    return res.status(200).json({
      email,
      pwned: true,
      breach_count: 3,
      message: "Test API endpoint working!"
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
