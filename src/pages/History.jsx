import { useEffect, useState } from "react";
import { getAllGames } from "../service/gameservice";

function History() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllGames();

      setGames(response.games || response || []);
    } catch (error) {
      console.error("Error fetching game history:", error);
      setError("Unable to fetch game history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const getPlayerName = (game, role) => {
    const player = game.players?.find(
      (item) => item.role === role
    );

    return player?.name || "—";
  };

  const getGameStats = (game) => {
    const rounds = game.rounds || [];

    const player1Score = rounds.reduce(
      (total, round) => total + (round.player1Score || 0),
      0
    );

    const player2Score = rounds.reduce(
      (total, round) => total + (round.player2Score || 0),
      0
    );

    const ties = rounds.filter(
      (round) => round.winner === "tie"
    ).length;

    const totalRounds = rounds.filter(
      (round) =>
        round.player1Choice && round.player2Choice
    ).length;

    return {
      player1Score,
      player2Score,
      ties,
      totalRounds,
    };
  };

  const getWinnerName = (game, stats) => {
    if (
      game.status !== "completed" ||
      stats.totalRounds < 6
    ) {
      return "Unfinished";
    }

    if (game.winner === "tie") {
      return "Tie";
    }

    if (game.winner === "player1") {
      return getPlayerName(game, "player1");
    }

    if (game.winner === "player2") {
      return getPlayerName(game, "player2");
    }

    return "—";
  };

  const getStatusLabel = (game, stats) => {
    if (
      game.status !== "completed" ||
      stats.totalRounds < 6
    ) {
      return "Unfinished";
    }

    return "Completed";
  };

  const getStatusStyle = (status) => {
    if (status === "Completed") {
      return "bg-green-100 text-green-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-100 px-3 py-5">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Game History
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              View all previously played games.
            </p>
          </div>

          <button
            onClick={fetchGames}
            disabled={loading}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-xs text-gray-600">
              Loading game history...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-lg bg-red-100 p-3 text-center text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && games.length === 0 && (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-700">
              No games found.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Play your first game to see it here.
            </p>
          </div>
        )}

        {/* History table */}
        {!loading && !error && games.length > 0 && (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[750px] border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-gray-800 text-[10px] uppercase text-white">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2">
                      #
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Player 1
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Player 2
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Score
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Ties
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Rounds
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Winner
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-3 py-2">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {games.map((game, index) => {
                    const stats = getGameStats(game);
                    const winner = getWinnerName(game, stats);
                    const status = getStatusLabel(game, stats);

                    return (
                      <tr
                        key={game._id}
                        className="border-b text-xs transition last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                          {index + 1}
                        </td>

                        <td className="max-w-[120px] truncate px-3 py-2 font-medium text-gray-800">
                          {getPlayerName(game, "player1")}
                        </td>

                        <td className="max-w-[120px] truncate px-3 py-2 font-medium text-gray-800">
                          {getPlayerName(game, "player2")}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-gray-700">
                          {stats.player1Score} - {stats.player2Score}
                        </td>

                        <td className="px-3 py-2 text-gray-700">
                          {stats.ties}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                          {stats.totalRounds} / 6
                        </td>

                        <td
                          className={`whitespace-nowrap px-3 py-2 font-semibold ${
                            winner === "Unfinished"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          {winner}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                          {game.createdAt
                            ? new Date(
                                game.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;