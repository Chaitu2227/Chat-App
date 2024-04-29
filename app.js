require('dotenv').config();
var mongoose = require('mongoose');

mongoose.connect("mongodb+srv://firefalls2004:ngJIDtJEPFap38Ku@new-cluster.ruqus0u.mongodb.net/Chat-App?retryWrites=true&w=majority&appName=New-Cluster");

const app = require('express')();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute');
const User = require('./models/userModel');
const Chat = require('./models/chatModel');

app.use('/',userRoute);

const io = require('socket.io')(http);

var usp = io.of('/user-namespace');

usp.on('connection',async function(socket){
    console.log('User Connected');

    var userId = socket.handshake.auth.token;

    // console.log(socket.handshake.auth.token)

    await User.findByIdAndUpdate({_id: userId}, {$set:{is_online:'1'}});

    //broadcast online status

    socket.broadcast.emit('getOnlineUser',{user_id: userId});


    socket.on('disconnect',async function(){
        console.log('user disconnected');

        var userId = socket.handshake.auth.token;

        // console.log(socket.handshake.auth.token)
    
        await User.findByIdAndUpdate({_id: userId}, {$set:{is_online:'0'}});

            //broadcast offline status

        socket.broadcast.emit('getOfflineUser',{user_id: userId});

    });

    //chatting implementation
    socket.on('newChat', function(data){
        socket.broadcast.emit('loadNewChat', data);
    });

    //load old chats
    socket.on('existsChat',async function(data){
    var chats = await Chat.find({$or:[
            {sender_id:data.sender_id, receiver_id:data.receiver_id},
            {sender_id:data.receiver_id, receiver_id:data.sender_id},
        ]});

        socket.emit('loadChats', {chats: chats});

    });

    //delete chats
    socket.on('chatDeleted', function(id){
        socket.broadcast.emit('chatMessageDeleted', id);

    });

    //update chats
    socket.on('chatUpdated', function(data){
        socket.broadcast.emit('chatMessageUpdated', data);
    
    });

});


http.listen(3000,()=>{
    console.log('Server is running');
});