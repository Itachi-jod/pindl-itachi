const { pinterest } = require("btch-downloader");

const AUTHOR = "MinatoCode";

// Pretty JSON response
function pretty(data) {
  return JSON.stringify(data, null, 2);
}

// Replace every developer field recursively
function replaceDeveloper(obj) {
  if (Array.isArray(obj)) {
    return obj.map(replaceDeveloper);
  }

  if (obj && typeof obj === "object") {
    const output = {};

    for (const [key, value] of Object.entries(obj)) {
      output[key] =
        key === "developer"
          ? AUTHOR
          : replaceDeveloper(value);
    }

    return output;
  }

  return obj;
}

// Keep only images.original in search results
function cleanSearch(data) {
  data = replaceDeveloper(data);

  if (
    data?.result?.result &&
    Array.isArray(data.result.result)
  ) {
    data.result.result = data.result.result.map(item => {
      const original = item.images?.original;

      return {
        ...item,
        images: original ? { original } : {}
      };
    });
  }

  return data;
}

// Add downloadUrl from result.image
function formatDownload(data) {
  data = replaceDeveloper(data);

  const downloadUrl = data?.result?.image;

  if (data?.result && downloadUrl) {
    data.result.downloadUrl = downloadUrl;
  }

  return data;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const send = (status, data) => {
    return res.status(status).send(pretty(data));
  };

  // GET only
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return send(405, {
      developer: AUTHOR,
      status: false,
      message: "Method Not Allowed"
    });
  }

  const path = req.url.split("?")[0];

  // Pinterest Downloader
  if (path === "/api/pindl") {
    const url = req.query.url;

    if (!url) {
      return send(400, {
        developer: AUTHOR,
        status: false,
        message: "Missing ?url= parameter"
      });
    }

    try {
      const data = await pinterest(url);

      return send(200, formatDownload(data));

    } catch (error) {
      return send(500, {
        developer: AUTHOR,
        status: false,
        message: "Pinterest download failed",
        error: error.message
      });
    }
  }

  // Pinterest Search
  if (path === "/api/search") {
    const query = req.query.query;

    if (!query) {
      return send(400, {
        developer: AUTHOR,
        status: false,
        message: "Missing ?query= parameter"
      });
    }

    try {
      const data = await pinterest(query);

      return send(200, cleanSearch(data));

    } catch (error) {
      return send(500, {
        developer: AUTHOR,
        status: false,
        message: "Pinterest search failed",
        error: error.message
      });
    }
  }

  // Invalid Endpoint
  return send(404, {
    developer: AUTHOR,
    status: false,
    message: "Endpoint Not Matched",
    availableEndpoints: [
      "/api/pindl?url=",
      "/api/search?query="
    ]
  });
};
