// Frame work to run on nodejs
var express = require('express');
// To retrive content form requested page
var bodyParser = require('body-parser');
// User for loging the server connections
var morgan = require('morgan');
// To manage mongodb 
var mongoose = require('mongoose');
// Basic configuration file
var config = require('./config');
// Get passport
var passport = require('passport');
// Get user module
var User = require('./app/models/user');
// Get jsonwebtoken
var jwt = require('jsonwebtoken');
// Get File System
var fs = require('fs');

// Initialize express server
var app = express();

// Create server for socket io
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Initialize body parser
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));

mongoose.Promise = global.Promise;
// Connect mongob using mongoose
mongoose.connect(config.database, function(err){
	if(err) console.log(err);
	else console.log("Connected to database");
});

//  Initialize passport
app.use(passport.initialize());


var api = require('./app/routes/api')(app, express, io);
app.use('/chat', api)

// Redirect all paths to index page
app.get('*', function(req, res){
	res.sendFile(__dirname + '/public/app/views/index.html');
});



// Make server to listen on port 3000
http.listen(config.port, '0.0.0.0', function(err){
	if(err) console.log(err);
	else console.log("Listening to port " + config.port);
});

// Handle all chat functions with data base
var User = require('./app/models/user');
var Chat = require('./app/models/chat');
var liveusers = [];


// function to insert message to database
function insertmessagetodb(mid, sender, receiver, msg, time, senderid, receiverid, uread, schatid, rchatid, file, img, zip) {
    var findsender = schatid, findreceiver = rchatid, senderId = senderid, receiverId = receiverid;
    var updateMessage = {
        messageId: mid,
        message: msg,
        sender: sender,
        receiver: receiver,
        dateTime: time,
        edited: 0,
        deleted: 0,
        files: file,
        image: img,
        archived: zip,
        unread: uread
    };
    var updateReceiver = {
        messageId: mid,
        message: msg,
        sender: sender,
        receiver: receiver,
        dateTime: time,
        edited: 0,
        deleted: 0,
        files: file,
        image: img,
        archived: zip,
        unread: uread
    };
    if(uread) {

      User.update({ "_id" : senderId}, {$push : { "mesunread" : receiverId }}, function (err, data) {
          if (err) throw err;
          else console.log(data);
      });
    }
    Chat.findOne({ 'chatdetails.chatid': findsender }, function(err, data) {
        if (err) throw err;
        if(data) {
            data.update({ $push: { "chatdetails.chat": updateMessage } }, function(err, data) {
                if (err) throw err;
                else console.log(data);
            });
        }
        else {
            var chatObject = new Chat();
            chatObject.chatdetails = { 
              chatid : findsender, 
              unread   : [],
              chat : [updateMessage] 
            };
            chatObject.save(function (err, datas) {
              if(err) throw err;
              else {}
            });
        }
    });
    Chat.findOne({ 'chatdetails.chatid': findreceiver }, function(err, data) {
        if (err) throw err;
        if(data) {
                if(uread){
                  data.update({ $push: { "chatdetails.unread" : mid, "chatdetails.chat": updateReceiver } }, function(err, data) {
                      if (err) throw err;
                      else console.log(data);
                  });
                }
                else {
                  data.update({ $push: { "chatdetails.chat": updateReceiver } }, function(err, data) {
                      if (err) throw err;
                      else console.log(data);
                  });
                }
        }
        else {
            var chatObject = new Chat();
            if(uread) {
                chatObject.chatdetails = { 
                  chatid : findreceiver, 
                  unread : [mid],
                  chat   : [updateReceiver] 
                };
            }
            else {
              chatObject.chatdetails = { 
                  chatid : findreceiver, 
                  unread : [],
                  chat   : [updateReceiver] 
                };
            }
            chatObject.save(function (err, datas) {
              if(err) throw err;
              else {}
            });
        }
    });

}

// function to update edit and delete message to database
function updateMessageToDB(id, sender, receiver, msg, time, edit, del) {

    Chat.update({ 'chatdetails.chatid': sender, 'chatdetails.chat.messageId': id}, 
      {$set : {
        'chatdetails.chat.$.message' : msg, 
        'chatdetails.chat.$.dateTime' : time,
        'chatdetails.chat.$.edited' : edit,
        'chatdetails.chat.$.deleted' : del
      }}, function(err, data) {
        if (err) throw err;
        else console.log(data);
    });
    Chat.update({ 'chatdetails.chatid': receiver, 'chatdetails.chat.messageId': id}, 
      {$set : {
        'chatdetails.chat.$.message' : msg, 
        'chatdetails.chat.$.dateTime' : time,
        'chatdetails.chat.$.edited' : edit,
        'chatdetails.chat.$.deleted' : del
      }}, function(err, data) {
        if (err) throw err;
        else console.log(data);
    });

}

// function to emit live user
function updateliveuser (){
    io.emit('liveuser', liveusers);
}

var userids = {};
var sockets = {};

// processing all function when user in online mode or active mode
io.on('connection', function(socket){



  // When new user login update the number of user in online & push user list to live user
  socket.on('new user', function(data){
    console.log('a user is connected');
    var exist;
    socket.userid = data;
    userids[socket.userid] = socket;
    if(socket.userid) {
      for (var i = 0; i < liveusers.length; i++) {
        if(liveusers[i] == socket.userid) { exist = true; }
      }
      if(!exist) {
        liveusers.push(socket.userid);
      }
    }
    var totalUsers = User.find({});
    var values = [];
    totalUsers.exec(function (err, docs){
      if (err) throw err;
      else {
        for (var i = 0; i < docs.length; i++) {
          if(data == docs[i]._id){}
          else {
            values.push({'username' : docs[i].username, 'userid' : docs[i]._id, 'unread' : docs[i].mesunread});
          }
        }
        userids[data].emit('load contacts', values);
        updateliveuser ();
      }
    });
  });

  // load old messages to respective client
  socket.on('get individual messages', function(data, callback) {
    var x = data.requestId;
    var query;
    var chatData = [];
    var status = [];
    Chat.findOne({ 'chatdetails.chatid': x }, function(err, datas) {
        if (err) throw err;
        if(datas) {
            for (var i = 0; i < datas.chatdetails.chat.length; i++) {
              chatData.push(datas.chatdetails.chat[i]);
            }
            if(datas.chatdetails.unread) {
              for (var i = 0; i < datas.chatdetails.unread.length; i++) {
                status.push(datas.chatdetails.unread[i]);
              }
            }
            userids[data.user].emit('load old messages', {mes: chatData, stat: status });
        }
        else {
            userids[data.user].emit('load old messages', { mes: chatData, stat: status });
        }
      });
  });

  // update the read message in db
  socket.on('mark as read', function(data, callback){
    Chat.update({ 'chatdetails.chatid': data.myid }, 
      {$set : {
        'chatdetails.unread' : []
      }}, function(err, data) {
        if (err) throw err;
        else console.log(data);
    });
    var uid = data.userid, rid = data.receiverid;
    User.update({ "userid" : rid}, {$pull : { "mesunread" : uid }}, function (err, data) {
        if (err) throw err;
        else console.log(data);
    });
  });

  // get preivate message from client update to db and push back to respective client
  socket.on('private message', function(msg, callback){
      userids[msg.toid].emit('private', { id: msg.messageid, message : msg.message, from : msg.from, time: msg.time });
      // push message to db
      insertmessagetodb(msg.messageid, msg.from, msg.to, msg.message, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 0, 0, 0);
  });

  // Handel Ofline private messaging
  socket.on('ofline private message', function(msg, callback){
      // push message to db
      insertmessagetodb(msg.messageid, msg.from, msg.to, msg.message, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 0, 0, 0);
  });
  
  // Handel editing messages             
  socket.on('edit message', function(msg){
    io.emit('edit mes', { Id: msg.messageid, message : msg.message, time: msg.time });
    updateMessageToDB(msg.messageid, msg.from, msg.to, msg.message, msg.time, 1, 0);
  });

  // Handel deleting messages
  socket.on('delete message', function(msg){
    io.emit('delete msg', { Id: msg.messageid, message : msg.message, time: msg.time });
    updateMessageToDB(msg.messageid, msg.from, msg.to, msg.message, msg.time, 0, 1);
  });


  socket.on('files', function(data){
    io.emit('fileDadta', data );
  });  
  
  // get preivate message from client update to db and push back to respective client
  socket.on('private file', function(msg, callback){

      var mesid = msg.messageid;
      var fileName = msg.file.fname;
      var filePath = '/files/' + msg.file.fname;
      var file = msg.file.file;
      var image = msg.file.img;
      var compressed = msg.file.arch;

      if (file) {
        userids[msg.toid].emit('fileDadta', { id: mesid, fileName: fileName, filePath: filePath, from: msg.from, time: msg.time, file: 1, img: 0, archived: 0 });
        // push message to db
        insertmessagetodb(msg.messageid, msg.from, msg.to, filePath, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 1, 0, 0);
        
      }
      if (image) {
        userids[msg.toid].emit('fileDadta', { id: mesid, fileName: fileName, filePath: filePath, from: msg.from, time: msg.time, file: 0, img: 1, archived: 0 });
        // push message to db
        insertmessagetodb(msg.messageid, msg.from, msg.to, filePath, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 0, 1, 0);
      }
      if (compressed) {
        userids[msg.toid].emit('fileDadta', { id: mesid, fileName: fileName, filePath: filePath, from: msg.from, time: msg.time, file: 0, img: 0, archived: 1 });
        // push message to db
        insertmessagetodb(msg.messageid, msg.from, msg.to, filePath, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 0, 0, 1);
        
      }
  });

  // Handel Ofline private messaging
  socket.on('ofline private file', function(msg, callback){

      var mesid = msg.messageid;
      var filePath = '/files/' + msg.file.fname;
      var file = msg.file.file;
      var image = msg.file.img;
      var compressed = msg.file.arch;
      
      if (file) {
        // push message to db
        insertmessagetodb(mesid, msg.from, msg.to, filePath, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 1, 0, 0);
      }
      if (image) {
        // push message to db
        insertmessagetodb(mesid, msg.from, msg.to, filePath, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 0, 1, 0);
      }
      if (compressed) {
        // push message to db
        insertmessagetodb(mesid, msg.from, msg.to, filePath, msg.time, msg.userid, msg.toid, msg.unread, msg.schatid, msg.rchatid, 0, 0, 1);
      }
  });
  

  // After user logged out
  socket.on('disconnect me', function(data){
    console.log('auto disconnection');
    liveusers.splice(liveusers.indexOf(data), 1);
    updateliveuser ();
  });


  // After user disconnecting updating number of users in online
  socket.on('disconnect', function(data){
    console.log('disconnection time out');
    if(!socket.userid) return;
    liveusers.splice(liveusers.indexOf(socket.userid), 1);
    updateliveuser ();
  });

});