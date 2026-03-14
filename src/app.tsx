import React from "react";
import { createRoot } from "react-dom/client";
import { Bundler } from "./Bundler";

const root = createRoot(document.getElementById("root"));
root.render(<Bundler />);
