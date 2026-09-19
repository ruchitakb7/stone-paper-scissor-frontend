A real-time multiplayer Stone Paper Scissor game built using React, Node.js, Express, MongoDB, and Socket.IO.

# Technologies Used
Frontend: React.js, Vite, Tailwind CSS, Socket.IO Client
Backend: Node.js, Express.js, MongoDB, Mongoose, Socket.IO
Deployment: AWS EC2, Nginx, MongoDB Atlas


# How the Game Works
Player 1 creates a game and receives a unique Game ID.
Player 1 shares the Game ID with Player 2.
Player 2 joins using the Game ID.
Both players select Rock, Paper, or Scissors.
Choices are stored until both players submit.
The server determines the winner.
The result is displayed to both players in real time.