const http = require("http");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./middleware/authMiddleware");
const app = require("./app");

const token = jwt.sign({ id: 1, role: 2, verify: 1 }, JWT_SECRET);

const request = (port, path, method = "GET") =>
  new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode, body: data });
        });
      },
    );

    req.on("error", reject);
    req.end();
  });

const server = app.listen(0, async () => {
  const port = server.address().port;

  try {
    const getRes = await request(port, "/api/v1/pet-snap");
    const getPayload = JSON.parse(getRes.body);
    console.log("GET_STATUS", getRes.status);
    console.log("GET_KEYS", Object.keys(getPayload.data || {}).join(","));

    const petId = getPayload && getPayload.data && getPayload.data.pet ? getPayload.data.pet.id : null;
    if (!petId) {
      console.log("NO_PET_AVAILABLE");
      return;
    }

    const likeRes = await request(port, `/api/v1/pet-snap/${petId}/like`, "POST");
    const likePayload = JSON.parse(likeRes.body);
    console.log("LIKE_STATUS", likeRes.status);
    console.log("LIKE_KEYS", Object.keys(likePayload.data || {}).join(","));

    const nextId = likePayload && likePayload.data && likePayload.data.pet ? likePayload.data.pet.id : petId;

    const dislikeRes = await request(port, `/api/v1/pet-snap/${nextId}/dislike`, "POST");
    const dislikePayload = JSON.parse(dislikeRes.body);
    console.log("DISLIKE_STATUS", dislikeRes.status);
    console.log("DISLIKE_KEYS", Object.keys(dislikePayload.data || {}).join(","));
  } catch (error) {
    console.error(error);
  } finally {
    server.close();
  }
});
