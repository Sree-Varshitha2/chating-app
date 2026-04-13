import React, { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  const [user, setUser] = useState("");

  return (
    <>
      {user ? <Chat user={user} /> : <Login setUser={setUser} />}
    </>
  );
}

export default App;