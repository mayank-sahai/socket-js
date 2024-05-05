const http = require("http");
const crypto = require("crypto");
const {
  WEBSOCKET_MAGIC_KEY,
  SEVEN_BITS,
  SIXTEEN_BITS, // TODO FOR LONG MESSAGES
  SIXTY_FOUR_BITS, // TODO FOR LONG MESSAGES
  FIRST_BIT,
  MASK_KEY_BYTES_LENGTH,
  OPCODE_TEST,
} = require("./constants");

// ****************** utility functions ******************
const concatBuffer = (bufferList, totalLength) => {
  const target = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (const buffer of bufferList) {
    target.set(buffer, offset);
    offset += buffer.length;
  }
  return target;
};

const unmask = (encodedBuffer, maskKey) => {
  // % 4 is because there are 4 bytes in mask key so it will return 0,1,2,3 only.
  const decoded = Buffer.from(encodedBuffer).map(
    (elt, i) => elt ^ maskKey[i % 4]
  );
  return decoded;
};

const prepareMessage = (data) => {
  const msg = Buffer.from(data);
  const messageSize = msg.length;

  let dataFrameBuffer;
  let offset = 2;

  const firstByte = 0x80 | OPCODE_TEST;
  if (messageSize <= SEVEN_BITS) {
    const bytes = [firstByte];
    dataFrameBuffer = Buffer.from(bytes.concat(messageSize));
  } else {
    throw new Error("message too long!");
  }

  const totalLength = dataFrameBuffer.byteLength + messageSize;
  const dataFrameResponse = concatBuffer([dataFrameBuffer, msg], totalLength);
  return dataFrameResponse;
};

const sendMessage = (msg, socket) => {
  const dataFrameResponse = prepareMessage(msg);
  socket.write(dataFrameResponse);
};

// ****************** websocket data handling ******************
const handleIncomingMessage = (socket) => {
  // as we don't have to deal with 1st byte for ignoring it
  socket.read(1);

  // reading second byte in frame which is - mask indicator(1 bit) and payload length
  const [maskIndicatorAndPayloadLength] = socket.read(1);
  // because first bit is always 1 for client-to-server messages as it is masked
  // subtracting one bit (128 or '10000000')
  // from this byte to get rid of the Mask bit
  const lengthIndicatorInBits = maskIndicatorAndPayloadLength - FIRST_BIT;
  let messageLength = 0;
  if (lengthIndicatorInBits <= SEVEN_BITS) {
    messageLength = lengthIndicatorInBits;
  } else {
    throw Error("tooooo long"); // TODO will be handled when long messages support will be added
  }
  const maskKey = socket.read(MASK_KEY_BYTES_LENGTH);
  const encoded = socket.read(messageLength);
  const decoded = unmask(encoded, maskKey);
  const receivedData = decoded.toString("utf8");
  const data = JSON.parse(receivedData);
  console.log("message received - ", data);
  const sendData = JSON.stringify({
    status: "received the basic message",
    at: new Date().toISOString(),
  });
  sendMessage(sendData, socket);
};

// ****************** handshake handling ******************
const acceptSocket = (id) => {
  const hash = crypto.createHash("sha1");
  hash.update(id + WEBSOCKET_MAGIC_KEY);
  return hash.digest("base64");
};

const generateHandshakeResponse = (id) => {
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

const handleWebSocketUpgrade = (req, socket, headers) => {
  const { "sec-websocket-key": webClientSocketKey } = req.headers;
  console.log(`${webClientSocketKey} socket key`);
  const serverHandshakeResponse = generateHandshakeResponse(webClientSocketKey);
  console.log({
    serverHandshakeResponse,
  });
  socket.write(serverHandshakeResponse);
  socket.on("readable", () => handleIncomingMessage(socket));
};

// ****************** server setup ******************
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

server.on("upgrade", handleWebSocketUpgrade);
