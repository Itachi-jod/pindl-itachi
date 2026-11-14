const AUTHOR = "MinatoCode";

module.exports = async (req, res) => {
  const send = (status, data) => {
    res.status(status);
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(data, null, 2));
  };

  const isRoot = req.url === "/" || req.url === "/api" || req.url === "/api/";

  return send(isRoot ? 200 : 404, {
    success: isRoot,
    author: AUTHOR,
    message: isRoot
      ? "Welcome to the Pinterest API! Use one of the available endpoints below."
      : `Invalid endpoint '${req.url}'. Please use one of the valid endpoints listed below.`,
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
};
