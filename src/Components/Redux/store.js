import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import pendingUserReducer from "./Slices/pendingUserSlice";
import projectReducer from "./Slices/projectSlice";
import leadReducer from "./Slices/leadSlice"

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["pendingUsers", "project","lead"],
};

const rootReducer = combineReducers({
  pendingUsers: pendingUserReducer,
  project: projectReducer,
  lead: leadReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
