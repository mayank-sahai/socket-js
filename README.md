# WebSocket Server

This project is running a nodejs server in which we have implemented websocket protocol without using socket.io(or any other alternative).

## Introduction

This WebSocket server allows communication between clients and the server using the WebSocket protocol. It handles WebSocket upgrade requests and manages WebSocket connections.

## Features

- Handles WebSocket upgrade requests
- Supports WebSocket communication with clients
- Parses WebSocket frames and messages

## Installation

1. Clone the repository:
```
git clone https://github.com/mayank-sahai/socket-js
```
2. Install dependencies:
```
cd websocket-server
npm install
```

## Usage

To use this WebSocket server, follow these steps:

1.  Start the server by 
``` 
npm start 
```
2. Open `index.js` in your browser it will straight away start the handshake and send/receive messages
3. Check logs (if you want 😄 )
