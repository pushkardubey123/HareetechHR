import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store, persistor } from "./Components/Redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { SettingsProvider } from "./Components/Redux/SettingsContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

// FIX: Isko Quotes (" ") ke andar rakhein
const GOOGLE_CLIENT_ID = "302942601811-qvc3ag5jot5s60vl15q0998eio1o4snc.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SettingsProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        </SettingsProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);