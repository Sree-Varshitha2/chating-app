import React, { useState } from "react";

function Login({ setUser }) {
  const [name, setName] = useState("");

  return (
    <div className="login">
      <h2>Login</h2>

      <input
        placeholder="Enter username"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={() => name && setUser(name)}>
        Enter Chat
      </button>
    </div>
  );
}

export default Login;