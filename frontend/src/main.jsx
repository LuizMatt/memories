import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// pages
import AddMemory from "./routes/AddMemory.jsx";
import Home from "./routes/Home.jsx";
import Memory from "./routes/Memory.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/add-memory", element: <AddMemory /> },
      { path: "/memories/:id", element: <Memory /> },
    ],
  },
]); 
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
