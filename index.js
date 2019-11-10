'use strict';
//dot env: loads environment variables from a .env file into process.env.
var dotenv = require('dotenv');
dotenv.load();

const express = require('express');
const app = express();

// uuid: can be used for multiple purposes, from tagging objects with an 
//extremely short lifetime, to reliably identifying very persistent objects
// across a network
const uuidv1 = require('uuid/v1');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const AI_SESSION_ID = uuidv1();

//apiai: allows integrating agents from the Api.ai natural language processing 
//service with your Node.js application.
const dialogflow = require('apiai');
const ai = dialogflow(ACCESS_TOKEN);


app.use(express.static(__dirname + '/views')); // HTML Pages
app.use(express.static(__dirname + '/public')); // CSS, JS & Images

const server = app.listen(3000, function(){
	console.log('listening on  port %d', server.address().port);
});

//Socket.IO enables real-time, bidirectional and event-based communication.
const socketio = require('socket.io')(server);
socketio.on('connection', function(socket){
  console.log('a user connected');
});

//Serve UI
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/app.html');
});

socketio.on('connection', function(socket) {
  socket.on('chat request', (text) => {
    console.log('Message: ' + text);

    // Get a reply from API.ai

    let aiReq = ai.textRequest(text, {
      sessionId: AI_SESSION_ID
    });

    aiReq.on('response', (response) => {
      let aiResponse = response.result.fulfillment.speech;
      console.log('AI Response: ' + aiResponse);
      socket.emit('ai response', aiResponse);
    });

    aiReq.on('error', (error) => {
      console.log(error);
    });

    aiReq.end();

  });
});