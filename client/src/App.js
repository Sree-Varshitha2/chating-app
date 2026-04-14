import React, { useState } from "react";
import Chat from "./Chat";
import "./App.css";

function App() {
  const [user, setUser] = useState("");
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (name.trim()) {
      setUser(name);
    }
  };

  // 🔐 LOGIN PAGE
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Chatify 💬</h2>
          <p>Connect instantly ✨</p>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button onClick={handleLogin}>Start Chat</button>
        </div>
      </div>
    );
  }

  // 💬 CHAT PAGE
  return <Chat user={user} />;
}

export default App;
