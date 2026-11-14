const { pinterest } = require("btch-downloader");

const AUTHOR = "MinatoCode";

module.exports = async (req, res) => {
  const send = (status, data) => {
    res.status(status);
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(data, null, 2));
  };

  if (req.method !== "GET") {
    return send(405, {
      success: false,
      author: AUTHOR,
      error: "Method not allowed"
    });
  }

  try {
    // Accepts ?url=... (or ?query=... as a fallback)
    const pinUrl = req.query.url || req.query.query;

    if (!pinUrl) {
      return send(400, {
        success: false,
        author: AUTHOR,
        error: "Pinterest URL is required (e.g., ?url=https://pin.it/4CVodSq)"
      });
    }

    const data = await pinterest(pinUrl);

    // Drill down to the pin data object
    const pinData = data?.result?.result || data?.result || {};

    // Extract the image URL (handles if `image` is a string, an object with `.url`, or an array)
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
      return send(404, {
        success: false,
        author: AUTHOR,
        pinterestUrl: pinUrl,
        error: "Image URL not found"
      });
    }

    return send(200, {
      success: true,
      author: AUTHOR,
      pinterestUrl: pinUrl,
      downloadUrl: downloadUrl
    });

  } catch (error) {
    return send(500, {
      success: false,
      author: AUTHOR,
      error: error.message
    });
  }
};
