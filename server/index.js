const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let clients = [];

wss.on("connection", (ws) => {
  console.log("New client connected");

  clients.push(ws);

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // Broadcast message to all users
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log("Client disconnected");
  });
});

console.log("Server running on port " + PORT);