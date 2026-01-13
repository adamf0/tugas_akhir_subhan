import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Page/Home";
import Site from "./Page/Site";
import About from "./Page/About";
import Navbar from "./Components/Navbar";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/site" element={<Site />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
