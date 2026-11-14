const express = require("express");
const { pinterest } = require("btch-downloader");

const app = express();
const PORT = process.env.PORT || 3000;
const AUTHOR = "MinatoCode";

// Pretty-print all JSON responses automatically
app.set("json spaces", 2);

// ==========================================
// 1. PINTEREST SEARCH ENDPOINT
// ==========================================
app.get(["/api/search", "/search"], async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        author: AUTHOR,
        error: "Query is required (e.g., ?query=ichigo)"
      });
    }

    const data = await pinterest(query);

    const results =
      data?.result?.result?.result ||
      data?.result?.result ||
      data?.result ||
      [];

    const images = Array.isArray(results)
      ? results
          .map(item => item?.images?.original || item?.image_url)
          .filter(Boolean)
      : [];

    return res.status(200).json({
      success: images.length > 0,
      author: AUTHOR,
      count: images.length,
      images
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      author: AUTHOR,
      error: error.message
    });
  }
});

// ==========================================
// 2. PINTEREST DOWNLOAD ENDPOINT
// ==========================================
app.get(["/api/pindl", "/pindl"], async (req, res) => {
  try {
    const pinUrl = req.query.url || req.query.query;

    if (!pinUrl) {
      return res.status(400).json({
        success: false,
        author: AUTHOR,
        error: "Pinterest URL is required (e.g., ?url=https://pin.it/4CVodSq)"
      });
    }

    const data = await pinterest(pinUrl);
    const pinData = data?.result?.result || data?.result || {};

    let downloadUrl = null;
    if (Array.isArray(pinData.image)) {
      downloadUrl = pinData.image[0]?.url || pinData.image[0];
    } else if (typeof pinData.image === "object" && pinData.image !== null) {
      downloadUrl = pinData.image.url;
    } else {
      downloadUrl =
        pinData.image ||
        pinData?.images?.original ||
        pinData?.image_url ||
        null;
    }

    if (!downloadUrl) {
      return res.status(404).json({
        success: false,
        author: AUTHOR,
        pinterestUrl: pinUrl,
        error: "Image URL not found"
      });
    }

    return res.status(200).json({
      success: true,
      author: AUTHOR,
      pinterestUrl: pinUrl,
      downloadUrl: downloadUrl
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      author: AUTHOR,
      error: error.message
    });
  }
});

// ==========================================
// 3. ROOT & WRONG ENDPOINT GUIDE
// ==========================================
app.use((req, res) => {
  const isRoot = req.path === "/" || req.path === "/api" || req.path === "/api/";

  return res.status(isRoot ? 200 : 404).json({
    success: isRoot,
    author: AUTHOR,
    message: isRoot
      ? "Welcome to the Pinterest API! Use one of the available endpoints below."
      : `Invalid endpoint '${req.originalUrl}'. Please use one of the valid endpoints listed below.`,
    endpoints: {
      search: {
        method: "GET",
        path: "/api/search",
        query_param: "query",
        description: "Search Pinterest for original high-res images",
        example: "/api/search?query=ichigo"
      },
      download: {
        method: "GET",
        path: "/api/pindl",
        query_param: "url",
        description: "Download a direct image from a Pinterest URL",
        example: "/api/pindl?url=https://pin.it/4CVodSq"
      }
    }
  });
});

// Start server locally when testing in Termux / local terminal
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export Express app for Vercel
module.exports = app;
               
