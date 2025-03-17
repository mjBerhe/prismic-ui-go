import { useState } from "react";
import logo from "./assets/images/logo-universal.png";
import "./App.css";
import { Greet } from "../wailsjs/go/main/App";

function App() {
  const greet = async () => {
    const text = await Greet("name here");
    console.log(text);
  };

  return (
    <main>
      <h1 className="text-5xl">Hello</h1>
    </main>
  );
}

export default App;
