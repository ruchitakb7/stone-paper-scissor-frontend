import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-2xl font-bold text-indigo-600 no-underline"
        >
          SPS Game
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-gray-700 no-underline hover:text-indigo-600"
          >
            🎮 Play Game
          </Link>

          <Link
            to="/history"
            className="text-gray-700 no-underline hover:text-indigo-600"
          >
            📜 History
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;