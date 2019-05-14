const express = require('express')
const app = express();
const https = require('https');
const fs = require('fs');
var clients = [];
var client_number=0;
var joined_clients=[];
var https_server = https.createServer({
    key:fs.readFileSync("my-key.pem"),
    cert:fs.readFileSync("my-cert.pem")
  },app);


const io = require('socket.io')(https_server)
const port = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))


io.on('connection', function (socket) {
    socket.on("NewClient", function () {
        let client_info ={client_number,id:socket.id,}
        clients.push(client_info);
        clients.forEach(function(client){ io.to(client.id).emit("Get_Clients",clients)} )
        this.emit('CreatePeer',clients,client_info);
        client_number++;
        console.log(clients);
    })

    socket.on('NewClientOffer',Send_Offer_To_Client)
    socket.on('Answer', Send_Answer_To_Client);
    //socket.on('Clients_info',Send_Clients_info);
    socket.on('Join',Join_client);
    socket.on('disconnect', function(){
        
        for(let i=0;i<clients.length;i++){
            if(clients[i].id == socket.id){
                console.log(clients[i])
                delete clients[i]
                clients = clients.filter(n=>n)
            }
        }


        console.log(clients);
    })
    socket.on("log",print_log);
})





function Disconnect() {
    console.log(socket);
    /* clients.forEach(function(client){
           client.client_number == 
       })*/
      /*  delete clients[client_number];
        clients = clients.filter(n=>n)*/
        console.log('one client has left the room');
        console.log(clients);
 
}

/*function Send_Clients_info(conf){
    console.log(conf,clients[conf.start].id)
    io.to(clients[conf.start].id).emit("Get_Clients",clients);
}*/
function Join_client(number){
    joined_clients.push(number);
}

function Send_Answer_To_Client(answer,conf) {
    //console.log(answer,conf)
    for(let i =0 ; i<clients.length; i++){
        if(clients[i].client_number == conf.start){
          io.to(clients[i].id).emit("answer",answer,conf);
        }
    }
           
}



function Send_Offer_To_Client(data,conf){
    for(let i =0 ; i<clients.length; i++){
        if(clients[i].client_number == conf.dest){
            io.to(clients[i].id).emit("offer",data,conf);
        }
    }
    //console.log(data,conf)
}

function print_log(data){
    console.log(data)
}

https_server.listen(port, () => console.log(`Active on ${port} port`))



