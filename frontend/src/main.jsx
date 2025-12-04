import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "bootstrap/dist/css/bootstrap.min.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="927920966177-ei3569hlrhs8qjhnasvmbbbjaj5nvan9.apps.googleusercontent.com">
      {/* <GoogleOAuthProvider clientId= {import.meta.env.VITE_GOOGLE_CLIENT_ID}> */}
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
