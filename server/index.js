const WebSocket = require("ws");

const wss = new WebSocket.Server({ const PORT = process.env.PORT || 10000; });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    // broadcast to all users
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  });
});

console.log("Server started");
