import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store, persistor } from "./Components/Redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { SettingsProvider } from "./Components/Redux/SettingsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SettingsProvider>
  <App />
</SettingsProvider>

      </PersistGate>
    </Provider>
  </React.StrictMode>
);
