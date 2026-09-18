import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./component/Header";
import Game from "./pages/Game";
import History from "./pages/History";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;