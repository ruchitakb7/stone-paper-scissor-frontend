import api from "../axios/api";


export const createGame = async (playerName) => {
  const response = await api.post("/api/games/create", {
    playerName,
  });

  return response.data;
};


export const joinGame = async (roomCode, playerName) => {
  const response = await api.post("/api/games/join", {
    roomCode,
    playerName,
  });

  return response.data;
};


export const getGameById = async (gameId) => {
  const response = await api.get(`/api/games/${gameId}`);

  return response.data;
};


export const getAllGames = async () => {
  const response = await api.get("/api/games/");

  return response.data;
};