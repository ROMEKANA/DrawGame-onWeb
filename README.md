# DrawGame on Web

This project is a simple browser remake of the original iPhone prototype.
It includes a small Node.js WebSocket server and a HTML/JavaScript client.

## Setup

Install dependencies and start the server from the `server` folder:

```bash
cd server
npm install
npm start
```

The server serves the static files in `public/` and listens for
WebSocket connections on the same port. By default this is
`http://localhost:3000` (or the value of the `PORT` environment
variable). The WebSocket URL will therefore be `ws://localhost:3000`
when running locally.

Open your browser at `http://localhost:3000` to play. Enter a player name
and room ID to join a room. The first player can create a room and start
a round. Other players join the same room ID.

This is a minimal implementation meant for demonstration only.
