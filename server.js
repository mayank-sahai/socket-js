const http = require("http");
const crypto = require("crypto");
const WEBSOCKET_MAGIC_KEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
// Create a local server to receive data from
const server = http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: "Hello World!",
      })
    );
  })
  .listen(8000, () => {
    console.log("server listening on port 8000");
  });

const onSocketUpgrade = (req, socket, headers) => {
  const { "sec-websocket-key": webClientSocketKey } = req.headers;
  console.log(`${webClientSocketKey} socket connected`);
  const newHeaders = makeHandShakeHeaderData(webClientSocketKey);
  console.log({
    newHeaders,
  });
  socket.write(headers);
};

const makeHandShakeHeaderData = (id) => {
  const acceptKey = acceptSocket(id);
  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "",
  ]
    .map((line) => line.concat("\r\n"))
    .join("");
  return headers;
};

const acceptSocket = (id) => {
  const hash = crypto.createHash("sha1");
  hash.update(id + WEBSOCKET_MAGIC_KEY);
  return hash.digest("base64");
};

server.on("upgrade", onSocketUpgrade);
