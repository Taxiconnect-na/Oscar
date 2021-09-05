import Home from "./Home";
import { Provider } from "react-redux";
import HomeReducer from "./Redux/Reducers/HomeReducer";
import { createStore } from "redux";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import hardSet from "redux-persist/lib/stateReconciler/hardSet";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { PersistGate } from "redux-persist/integration/react";
import { parse, stringify, toJSON, fromJSON } from "flatted";

export const transformCircular = createTransform(
  (inboundState, key) => stringify(inboundState),
  (outboundState, key) => parse(outboundState)
);

const persistConfig = {
  key: "root",
  storage,
  stateReconciler: hardSet,
  transforms: [transformCircular],
};

// const store = createStore(HomeReducer);
const persistedReducer = persistReducer(persistConfig, HomeReducer);
let store = createStore(persistedReducer);
let persistor = persistStore(store);

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Home />
      </PersistGate>
    </Provider>
  );
}

export default App;
