const express = require('express')
const app = express();
const https = require('https');
const fs = require('fs');
let Rooms = {};
let https_server = https.createServer({
    key:fs.readFileSync("my-key.pem"),
    cert:fs.readFileSync("my-cert.pem")
  },app);


const io = require('socket.io')(https_server)
const port = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))


io.on('connection', function (socket) {

   
    socket.on('token_number',function(token){

        if(!Rooms[token]){
            Rooms[token]=[socket.id]
        }else{
            Rooms[token].push(socket.id)
        }
        
        console.log(Rooms)
        if(Rooms[token].length > 6){
                io.to(socket.id).emit("user-exceeded")
        }else{
            Rooms[token].forEach(function(SocketId){
                io.to(SocketId).emit("user-joined", socket.id, Rooms[token].length,Rooms[token])
            })
        }
     
         
        /*io.sockets.emit("user-joined", socket.id, io.engine.clientsCount, Object.keys(io.sockets.clients().sockets));*/
    })
	socket.on('signal', (toId, message) => {
		io.to(toId).emit('signal', socket.id, message,'sdp');
  	});

    socket.on("message", function(data){
		io.sockets.emit("broadcast-message", socket.id, data);
    })
    socket.on("request_lock",function(RoomId){
       if(Rooms[RoomId]!=undefined){
            if(Rooms[RoomId][0]==socket.id){
                Rooms[RoomId].forEach(function(socketId){
                    io.to(socketId).emit("signal",socket.id, true ,'lock')
                })
                delete Rooms[RoomId];
                console.log(Rooms)
            }else{
                io.to(socket.id).emit("signal",socket.id, false,'lock')
            }
       }
       
    })
	socket.on('disconnect', function() {
        let MyRoom
        let token
        Object.keys(Rooms).forEach(function(RoomId){
            for(let i=0;i<Rooms[RoomId].length;i++){
                if(Rooms[RoomId][i]==socket.id){
                    token = RoomId;
                    Rooms[RoomId][i]=undefined;
                }
            }
            Rooms[RoomId] =  Rooms[RoomId].filter(n=>n)
                 if(Rooms[RoomId].length == 0){
                     delete Rooms[RoomId]
                    }
        })
        console.log(Rooms)
        if(Rooms[token]){
            Rooms[token].forEach(function(SocketId){
                io.to(SocketId).emit("user-left", socket.id)
            })
        }
     


	})

})



https_server.listen(port, () => console.log(`Active on ${port} port`))



