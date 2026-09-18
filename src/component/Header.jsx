import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-indigo-600 no-underline"
        >
          SPS Game
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-gray-700 hover:text-indigo-600 no-underline"
          >
            🎮 Play Game
          </Link>

          <Link
            to="/history"
            className="text-gray-700 hover:text-indigo-600 no-underline"
          >
            📜 History
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;