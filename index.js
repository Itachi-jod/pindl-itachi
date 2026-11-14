
const { pinterest } = require("btch-downloader");

const AUTHOR = "Itachi";

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

function keepOriginalSearchImages(data) {
  const searchResults = data?.result?.result;

  if (!Array.isArray(searchResults)) {
    return data;
  }

  return {
    ...data,
    result: {
      ...data.result,
      result: searchResults.map((pin) => {
        if (!pin || typeof pin !== "object" || !pin.images) {
          return pin;
        }

        const original = pin.images.original;
        return {
          ...pin,
          images: typeof original === "string" ? { original } : {}
        };
      })
    }
  };
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const send = (status, data) => {
    return res.status(status).send(pretty(data));
  };

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
      const response = replaceDeveloper(data);
      const result = response?.result;

      if (result && typeof result === "object" && typeof result.image === "string") {
        result.downloadUrl = result.image;
      }

      return send(200, response);
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
      return send(200, keepOriginalSearchImages(replaceDeveloper(data)));
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
    
