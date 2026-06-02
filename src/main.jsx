import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store, persistor } from "./Components/Redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { SettingsProvider } from "./Components/Redux/SettingsContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

// FIX: Isko Quotes (" ") ke andar rakhein
const GOOGLE_CLIENT_ID = "978553589295-0q01d8a02ra2thi2h3p8g6re4gg95knb.apps.googleusercontent.com";

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