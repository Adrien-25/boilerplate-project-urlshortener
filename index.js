require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const dns = require("dns"); // Import the dns module
const urlparser = require("url"); // Import url module for parsing

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
app.use(express.urlencoded({ extended: false }));

// =========================================================
// NEW: In-memory URL storage
// =========================================================
const urlDatabase = [];
let shortUrlCounter = 1; // Simple counter for short URLs
// =========================================================
// =========================================================
// NEW: API endpoint for URL shortening
// POST /api/shorturl
// =========================================================
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  // 1. Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  // Check if protocol is http or https
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return res.json({ error: "invalid url" });
  }

  // 2. Use dns.lookup to verify hostname
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      // If DNS lookup fails, the hostname is invalid
      console.error(`DNS lookup failed for ${parsedUrl.hostname}:`, err);
      return res.json({ error: "invalid url" });
    } else {
      // Hostname is valid, proceed to save and generate short URL

      // Check if URL already exists in our database
      const existingEntry = urlDatabase.find(
        (entry) => entry.original_url === originalUrl,
      );
      if (existingEntry) {
        return res.json({
          original_url: existingEntry.original_url,
          short_url: existingEntry.short_url,
        });
      }

      // Generate a new short URL
      const newShortUrl = shortUrlCounter++;
      const newEntry = {
        original_url: originalUrl,
        short_url: newShortUrl,
      };
      urlDatabase.push(newEntry);

      res.json({
        original_url: newEntry.original_url,
        short_url: newEntry.short_url,
      });
    }
  });
});
// =========================================================
// NEW: API endpoint for redirecting short URLs
// GET /api/shorturl/:short_url
// =========================================================
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrlId = parseInt(req.params.short_url, 10); // Parse as integer

  // Find the original URL in the database
  const foundEntry = urlDatabase.find(
    (entry) => entry.short_url === shortUrlId,
  );

  if (foundEntry) {
    // Redirect to the original URL
    res.redirect(foundEntry.original_url);
  } else {
    // Short URL not found
    res.json({ error: "No short URL found for the given input" });
  }
});
// =========================================================

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
