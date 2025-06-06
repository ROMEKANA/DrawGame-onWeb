// server.js（ルートに置く！）

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
	console.log('WebSocket接続にゃ！');
	ws.on('message', (msg) => {
		console.log('受信:', msg);
		ws.send(`受け取ったにゃ: ${msg}`);
	});
});

server.listen(PORT, () => {
	console.log(`にゃんこサーバー起動！ポート: ${PORT}`);
});