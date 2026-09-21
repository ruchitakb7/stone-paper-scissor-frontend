
import { useEffect, useReducer } from "react";
import socket from "../util/socket.js";
import { createGame, joinGame } from "../service/gameservice.js";

const initialState = {
  screen: "lobby",
  mode: "create",
  playerName: "",
  roomCodeInput: "",

  gameId: "",
  roomCode: "",
  playerId: "",
  playerRole: "",
  players: [],

  currentRound: 1,
  myChoice: "",
  opponentReady: false,

  myScore: 0,
  opponentScore: 0,
  roundHistory: [],
  roundResult: null,
  finalWinner: null,
  showNextRound: false,

  loading: false,
  error: "",
  message: "",
};

function gameReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "SET_MULTIPLE_FIELDS":
      return {
        ...state,
        ...action.payload,
      };

    case "ADD_ROUND_RESULT":
      return {
        ...state,
        roundResult: action.payload.data,
        roundHistory: [
          ...state.roundHistory,
          action.payload.data,
        ],
        myScore: action.payload.myScore,
        opponentScore: action.payload.opponentScore,
        opponentReady: false,
        showNextRound: true,
        message: "",
      };

    case "RESET_ROUND":
      return {
        ...state,
        currentRound: action.payload.round,
        myChoice: "",
        roundResult: null,
        showNextRound: false,
        message: `Round ${action.payload.round}: Make your choice!`,
      };

    case "RESET_GAME":
      return initialState;

    default:
      return state;
  }
}

const choices = [
  {
    name: "Stone",
    value: "stone",
    emoji: "✊",
  },
  {
    name: "Paper",
    value: "paper",
    emoji: "✋",
  },
  {
    name: "Scissors",
    value: "scissors",
    emoji: "✌️",
  },
];

const Game = () => {

  const [state, dispatch] = useReducer(gameReducer, initialState);
  const {
    screen,
    mode,
    playerName,
    roomCodeInput,
    roomCode,
    playerId,
    playerRole,
    currentRound,
    myChoice,
    opponentReady,
    myScore,
    opponentScore,
    roundHistory,
    roundResult,
    finalWinner,
    showNextRound,
    loading,
    error,
    message,
  } = state;

  useEffect(() => {
    const handlePlayerJoined = (data) => {
      dispatch({
        type: "SET_MULTIPLE_FIELDS",
        payload: {
          ...(data.players && { players: data.players }),
          screen: "game",
          message: "Both players are ready!",
        },
      });
    };

    const handlePlayerReady = (data) => {
      if (data.playerId !== state.playerId) {
        dispatch({
          type: "SET_FIELD",
          field: "opponentReady",
          value: true,
        });
      }
    };

    const handleRoundResult = (data) => {
      const isPlayer1 = state.playerRole === "player1";

      dispatch({
        type: "ADD_ROUND_RESULT",
        payload: {
          data,
          myScore: isPlayer1 ? data.player1Score : data.player2Score,
          opponentScore: isPlayer1
            ? data.player2Score
            : data.player1Score,
        },
      });
    };

    const handleNextRound = (data) => {
      dispatch({
        type: "RESET_ROUND",
        payload: {
          round: data.round,
        },
      });
    };

    const handleGameCompleted = (data) => {
      dispatch({
        type: "SET_MULTIPLE_FIELDS",
        payload: {
          finalWinner: data.winner,
          screen: "completed",
        },
      });
    };

    const handleSocketError = (data) => {
      dispatch({
        type: "SET_FIELD",
        field: "error",
        value: data.message || "Something went wrong",
      });
    };

    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_ready", handlePlayerReady);
    socket.on("round_result", handleRoundResult);
    socket.on("next_round", handleNextRound);
    socket.on("game_completed", handleGameCompleted);
    socket.on("game_error", handleSocketError);

    return () => {
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_ready", handlePlayerReady);
      socket.off("round_result", handleRoundResult);
      socket.off("next_round", handleNextRound);
      socket.off("game_completed", handleGameCompleted);
      socket.off("game_error", handleSocketError);
    };
  }, [state.playerId, state.playerRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch({
      type: "SET_MULTIPLE_FIELDS",
      payload: { error: "", message: "" },
    });

    if (!playerName.trim()) {
      dispatch({
        type: "SET_FIELD",
        field: "error",
        value: "Please enter your name",
      });
      return;
    }

    if (mode === "join" && !roomCodeInput.trim()) {
      dispatch({
        type: "SET_FIELD",
        field: "error",
        value: "Please enter a room code",
      });
      return;
    }

    try {
      dispatch({ type: "SET_FIELD", field: "loading", value: true });

      const data =
        mode === "create"
          ? await createGame(playerName.trim())
          : await joinGame(
            roomCodeInput.trim().toUpperCase(),
            playerName.trim()
          );

      dispatch({
        type: "SET_MULTIPLE_FIELDS",
        payload: {
          gameId: data.gameId,
          roomCode: data.roomCode,
          playerId: data.playerId,
          playerRole: data.playerRole,
          players: [
            {
              playerId: data.playerId,
              name: playerName.trim(),
              role: data.playerRole,
            },
          ],
          screen: "waiting",
        },
      });

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("join_game", {
        roomCode: data.roomCode,
        playerId: data.playerId,
        playerName: playerName.trim(),
        playerRole: data.playerRole,
      });
    } catch (error) {
      dispatch({
        type: "SET_FIELD",
        field: "error",
        value: error.response?.data?.message || "Unable to create or join game",
      });
    } finally {
      dispatch({ type: "SET_FIELD", field: "loading", value: false });
    }
  };

  const handleChoice = (choice) => {
    if (state.myChoice || state.roundResult) return;

    dispatch({
      type: "SET_MULTIPLE_FIELDS",
      payload: {
        myChoice: choice,
        message: "Waiting for your opponent...",
      },
    });

    socket.emit("submit_choice", {
      roomCode: state.roomCode,
      playerId: state.playerId,
      choice,
    });
  };


  const handleNewGame = () => {
    socket.disconnect();
    dispatch({ type: "RESET_GAME" });
  };

  const handleNextRoundClick = () => {
    if (!showNextRound) return;

    socket.emit("request_next_round", {
      roomCode,
      playerId,
    });

    dispatch({
      type: "SET_FIELD",
      field: "showNextRound",
      value: false,
    });
  };

  const me = state.players.find(
    (player) => player.playerId === state.playerId
  );

  const opponent = state.players.find(
    (player) => player.playerId !== state.playerId
  );

  const canChoose = !state.myChoice && !state.roundResult && (state.playerRole === "player1" || state.opponentReady);

  const getWinnerText = () => {
    if (!state.roundResult) return "";

    if (state.roundResult.winner === "tie") {
      return "It's a tie!";
    }

    if (state.roundResult.winner === state.playerRole) {
      return "You won this round!";
    }

    return "Your opponent won this round!";
  };

  return (
    <>
      <div className="h-screen overflow-y-auto bg-gradient-to-br from-violet-50 via-white to-purple-100 px-2 py-3">
        <div className="mx-auto max-w-4xl">

          <div className="mb-4 text-center">
            <h1 className="text-lg font-extrabold text-violet-700 sm:text-3xl">
              Stone Paper Scissors
            </h1>

            <p className="mt-1 text-xs text-gray-600">
              Six rounds. One champion.
            </p>
          </div>

          {error && (
            <div className="mx-auto mb-3 max-w-sm rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {state.screen === "lobby" && (
            <div className="mx-auto max-w-sm rounded-xl bg-white p-4 shadow-xl sm:p-3">
              <div className="mb-3 flex rounded-lg bg-violet-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({
                      type: "SET_MULTIPLE_FIELDS",
                      payload: { mode: "create", error: "" },
                    });
                  }}
                  className={`w-1/2 rounded-lg px-3 py-2 font-semibold ${mode === "create"
                    ? "bg-violet-600 text-white shadow"
                    : "text-violet-700"
                    }`}
                >
                  Create Game
                </button>

                <button
                  type="button"
                  onClick={() => {
                    dispatch({
                      type: "SET_MULTIPLE_FIELDS",
                      payload: { mode: "join", error: "" },
                    });
                  }}
                  className={`w-1/2 rounded-lg px-3 py-2 font-semibold ${mode === "join"
                    ? "bg-violet-600 text-white shadow"
                    : "text-violet-700"
                    }`}
                >
                  Join Game
                </button>
              </div>

              <h2 className="mb-1 text-center text-lg font-bold text-gray-800">
                {mode === "create"
                  ? "Create a New Game"
                  : "Join a Game"}
              </h2>

              <p className="mb-3 text-center text-sm text-gray-500">
                {mode === "create"
                  ? "Enter your name to create a room."
                  : "Enter your name and room code."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Your Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={state.playerName}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "playerName",
                        value: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                    required
                  />
                </div>

                {state.mode === "join" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Room Code
                    </label>

                    <input
                      type="text"
                      placeholder="Enter room code"
                      value={state.roomCodeInput}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "roomCodeInput",
                          value: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 uppercase tracking-widest outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-violet-600 px-3 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "create"
                      ? "Create Game"
                      : "Join Game"}
                </button>
              </form>
            </div>
          )}

          {state.screen === "waiting" && (
            <div className="mx-auto max-w-md rounded-xl bg-white p-4 text-center shadow-xl">
              <div className="mb-3 text-3xl">🎮</div>

              <h2 className="text-lg font-bold text-gray-800">
                Waiting for Opponent
              </h2>

              <p className="mt-2 text-gray-500">
                Share this room code with your opponent.
              </p>

              <div className="my-3 rounded-2xl bg-violet-50 p-3">
                <p className="text-sm text-violet-600">
                  Room Code
                </p>

                <p className="mt-2 text-lg font-extrabold tracking-[0.3em] text-violet-700">
                  {roomCode}
                </p>
              </div>

              <p className="text-gray-600">
                Welcome, <strong>{playerName}</strong>
              </p>

              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Waiting for Player 2 to join...
              </div>

              <button
                onClick={handleNewGame}
                className="mt-3 rounded-xl border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}

          {state.screen === "game" && (
            <div className="mx-auto max-w-sm space-y-3">

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Room Code</p>
                  <p className="font-bold tracking-widest text-violet-700">
                    {roomCode}
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 px-4 py-2 text-center">
                  <p className="text-xs text-violet-500">Round</p>
                  <p className="font-bold text-violet-700">
                    {currentRound} / 6
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-violet-400 p-1 text-center text-white shadow-sm">
                  <p className="text-xs opacity-80">You</p>
                  <h3 className="mt-1 text-base font-bold">
                    {me?.name || playerName}
                  </h3>
                  <p className="mt-1 text-lg font-extrabold">
                    {myScore}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-800 p-1 text-center text-white shadow-sm">
                  <p className="text-xs opacity-80">Opponent</p>
                  <h3 className="mt-1 text-base font-bold">
                    {opponent?.name || "Waiting..."}
                  </h3>
                  <p className="mt-1 text-lg font-extrabold">
                    {opponentScore}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-2 text-center shadow-xl sm:p-3">
                <h2 className="text-sm font-bold text-gray-800">
                  {roundResult
                    ? "Round Result"
                    : `Round ${state.currentRound}`}
                </h2>



                <p className="mt-2 text-gray-500">
                  {roundResult
                    ? getWinnerText()
                    : myChoice
                      ? "Waiting for your opponent..."
                      : playerRole === "player2" && !opponentReady
                        ? "Waiting for Player 1 to select..."
                        : "Choose your move"}
                </p>

                {!roundResult && (
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {choices.map((choice) => (


                      <button
                        key={choice.value}
                        type="button"
                        disabled={!canChoose}
                        onClick={() => handleChoice(choice.value)}
                        className={`rounded-xl border-2 p-2 transition sm:p-3 ${myChoice === choice.value
                          ? "border-violet-600 bg-violet-100"
                          : "border-gray-100 bg-gray-50 hover:border-violet-400 hover:bg-violet-50"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span className="text-lg sm:text-3xl">
                          {choice.emoji}
                        </span>

                        <p className="mt-1 text-xs font-semibold text-gray-700">
                          {choice.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {myChoice && !roundResult && (
                  <div className="mt-3 rounded-xl bg-violet-50 p-4 text-sm text-violet-700">
                    You selected{" "}
                    <strong className="uppercase">
                      {myChoice}
                    </strong>
                    . Waiting for your opponent...
                  </div>
                )}

                {roundResult && (
                  <div className="mt-3 rounded-2xl bg-violet-50 p-4 text-center">

                    <p className="text-3xl">
                      {roundResult.winner === "tie"
                        ? "🤝"
                        : roundResult.winner === playerRole
                          ? "🏆"
                          : "😔"}
                    </p>

                    <h3 className="mt-2 text-lg font-extrabold text-violet-700">
                      {roundResult.winner === "tie"
                        ? "It's a Tie!"
                        : roundResult.winner === playerRole
                          ? "🎉 Congratulations! You Won!"
                          : "Your Opponent Won!"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      Round {roundResult.round} Result
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-gray-500">
                          {me?.name || playerName}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Selected
                        </p>

                        <p className="mt-1 text-lg font-bold uppercase">
                          {playerRole === "player1"
                            ? roundResult.player1Choice
                            : roundResult.player2Choice}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-gray-500">
                          {opponent?.name || "Opponent"}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Selected
                        </p>

                        <p className="mt-1 text-lg font-bold uppercase">
                          {playerRole === "player1"
                            ? roundResult.player2Choice
                            : roundResult.player1Choice}
                        </p>
                      </div>

                    </div>

                    <div className="mt-4 rounded-xl bg-white p-3">
                      <p className="text-sm text-gray-500">
                        Current Score
                      </p>

                      <p className="mt-1 text-lg font-bold text-violet-700">
                        {myScore} - {opponentScore}
                      </p>
                    </div>

                    {currentRound < 6 && (
                      <button
                        type="button"
                        onClick={handleNextRoundClick}
                        className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-bold text-white hover:bg-violet-700"
                      >
                        Next Round →
                      </button>
                    )}

                    {currentRound === 6 && (
                      <p className="mt-4 font-semibold text-gray-700">
                        Final round completed! 🎊
                      </p>
                    )}

                  </div>
                )}

                {message && !roundResult && !myChoice && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center shadow-sm">
                    <p className="text-sm font-medium text-blue-700">
                      {message}
                    </p>
                  </div>
                )}


              </div>

              {roundHistory.length > 0 && (
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <h3 className="mb-2 text-sm font-bold text-gray-800">
                    Round History
                  </h3>

                  <div className="space-y-1">
                    {roundHistory.map((round, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">
                          Round {round.round}
                        </span>

                        <span className="text-gray-600">
                          {round.winner === playerRole
                            ? "You won"
                            : round.winner === "tie"
                              ? "Tie"
                              : "Opponent won"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {screen === "completed" && (
            <div className="mx-auto max-w-md rounded-xl bg-white p-4 text-center shadow-xl">
              <div className="text-4xl">🏆</div>

              <h2 className="mt-2 text-xl font-extrabold text-violet-700">
                Game Completed!
              </h2>

              <p className="mt-3 text-gray-600">
                {finalWinner === "tie"
                  ? "The game ended in a tie!"
                  : finalWinner === playerRole
                    ? "Congratulations! You won!"
                    : "Your opponent won the game."}
              </p>

              <div className="my-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-violet-50 p-3">
                  <p className="text-sm text-gray-500">Your Score</p>
                  <p className="mt-2 text-lg font-extrabold text-violet-700">
                    {myScore}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-100 p-3">
                  <p className="text-sm text-gray-500">
                    Opponent Score
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-gray-800">
                    {opponentScore}
                  </p>
                </div>
              </div>

              <button
                onClick={handleNewGame}
                className="w-full rounded-xl bg-violet-600 px-3 py-2 font-semibold text-white hover:bg-violet-700"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl mt-10 border border-violet-200 bg-violet-50 px-3 py-3 text-center text-xs text-violet-800 sm:text-sm">
          🎮 <strong>How to Play:</strong> Click on{" "}
          <strong>Create Game</strong> to generate a unique Game ID. Share this ID
          with your friend and ask them to join using the same ID. Once your friend
          joins, you can start playing!
        </div>


      </div>


    </>

  );
};

export default Game;

