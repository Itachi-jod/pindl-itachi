
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
    const { query } = req.query;

    if (!query) {
      return send(400, {
        success: false,
        author: AUTHOR,
        error: "Query is required"
      });
    }

    const data = await pinterest(query);

    const results = data?.result?.result || data?.result || [];

    const images = Array.isArray(results)
      ? results
          .map(item => item?.images?.original)
          .filter(Boolean)
      : [];

    return send(200, {
      success: images.length > 0,
      author: AUTHOR,
      images
    });

  } catch (error) {
    return send(500, {
      success: false,
      author: AUTHOR,
      error: error.message
    });
  }
};
