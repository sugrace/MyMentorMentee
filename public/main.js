let Peer = require('simple-peer')
const _ = require('lodash');
let socket = io()
const video = document.querySelector('video')
const filter = document.querySelector('#filter')
let peer_list=[];
let client = {};
let clients=[];
let pending_peer;
var is_first=true;
let currentFilter
let video_count=0;
let client_number;
let confirm_register = [];
//get stream 
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()
        filter.addEventListener('change', (event) => {
            currentFilter = event.target.value
            video.style.filter = currentFilter
            var data={};
            data.currentFilter=currentFilter;
            refresh();
            SendFilter(data)
            event.preventDefault
        })
        //used to initialize a peer
        function InitPeer(init) {
          
            let peer = new Peer({ initiator: clients.length == 1 || init == 0 ? false : true, stream: stream, trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
            peer.on('close', function () {
                console.log("csafsdfsadfssdafsadfsdf")
                for(var i =0;i<peer_list.length;i++){
                    if(peer_list[i]!==undefined && peer_list[i]==peer){
                        console.log(i)
                        document.querySelector(`#peerVideo${i} > video`).remove();
                        peer.destroy()
                    }
                }
            })
            peer.on('data', function (data) {
                let decodedData = new TextDecoder('utf-8').decode(data)
                decodedData = JSON.parse(decodedData);
                let peervideo;
                console.log(decodedData.client_number,clients)
                for(let i=0;i<clients.length;i++){
                    if(clients[i].client_number==decodedData.client_number){
                        peervideo = document.querySelector(`#peerVideo${clients[i].id} > video`)
                        peervideo.style.filter = decodedData.currentFilter
                    }
                }
                   
                
            })
           
            return peer
        }
        //for peer of type init
         function MakePeer(data,client_info) {
               clients = data;
               var cur_client = data.length-1;
               client_number = client_info.client_number;
               confirm_register.push(client_info.id);
               socket.emit('log',client_info.client_number +"client has joined")
                        if(cur_client == 0){
                           let peer = InitPeer()
                           peer.on('signal', function (data) {
                            if (data.type == 'offer') {
                                client.conf = {start:client_number, dest:undefined,}
                                socket.emit('NewClientOffer',data,client.conf);
                            }else if(data.type == 'answer'){
                                socket.emit("Answer",data,client.conf)
                            }
                        })   
                            pending_peer=peer;
                        }else if(cur_client == 1){
                            let peer = InitPeer()
                            peer.on('signal', function (data) {
                                if (data.type == 'offer') {
                                    client.conf = {start:client_number, dest:clients[0].client_number,}
                                    socket.emit('NewClientOffer',data,client.conf);
                                }else if(data.type == 'answer'){
                                    socket.emit("Answer",data,client.conf)
                                }
                            })   
                            peer_list[clients[0].client_number]=peer;
                        }else{
                            clients.forEach(function(item){
                                if(item.client_number != client_number){
                                    let peer = InitPeer()
                                    peer.on('signal', function (data) {
                                        if (data.type == 'offer') {
                                            client.conf = {start:client_number, dest:clients[video_count++].client_number,}
                                            socket.emit('NewClientOffer',data,client.conf);
                                        }else if(data.type == 'answer'){
                                            socket.emit("Answer",data,client.conf)
                                        }
                                    })  
                                    peer_list[item.client_number]=peer;
                                }
                            })
                            console.log(peer_list)
                        }
        }
        function CreateVideo(stream) {
           console.log(clients);
           let target_id;
           for(let i =0;i<clients.length;i++){
                target_id = clients[i].id;
               for(let j=0;j<confirm_register.length;j++){
                    if(target_id == confirm_register[j]){
                        flag=false;
                        break;
                    }
                    flag = true;
                }
                if(flag==true){
                    break;
                }
            }
            confirm_register.push(target_id);

            console.log(confirm_register)
            console.log(clients)
            let div =document.createElement('div');
            div.className = `embed-responsive embed-responsive-16by9`
            document.querySelector('#peerVideo_list').appendChild(div);
            div.id=`peerVideo${target_id}`;
            let video = document.createElement('video')
            video.srcObject = stream;
            video.className='embed-responsive-item';
            document.querySelector(`#peerVideo${target_id}`).appendChild(video);
            video.play()
           
        }
        function SendFilter(data) {
            data.client_number=client_number;
            if (peer_list.length>0) {
                console.log(peer_list)
                peer_list.forEach((peer)=>{
                        if(peer.readable && peer){peer.send(JSON.stringify(data))}
                        }
                    )
            }
        }
        function receivedOffer(offer,conf){
            if(clients.length>2){
                let peer = InitPeer(0)
                peer.on('signal', function (data) {
                  if(data.type == 'answer'){
                        socket.emit("Answer",data,client.conf)
                    }
                })  
                peer_list[conf.start]= peer;
            }else if(clients.length == 2){
                peer_list[conf.start]=pending_peer;
            }
                client.conf = conf;
                peer_list[conf.start].signal(offer)
        }
        function receiveAnswer(answer,conf){
            client.conf = conf;
            peer_list[conf.dest].signal(answer);
        }

        function SessionActive() {
            document.write('Session Active. Please come back later')
        }

        function refresh(){
            
            document.querySelectorAll('.embed-responsive.embed-responsive-16by9').forEach(function(container){
                let video = container.lastChild;
                console.log(video)

                if(video.srcObject && video.srcObject.active==false){
                    video.hidden=true;
                    container.hidden=true;
                }
            })
        }
        function get_clients(data){
            clients=data;
        }
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('answer',receiveAnswer);
        socket.on('offer',receivedOffer);
        socket.on('Get_Clients',get_clients);
    })
    .catch(err => document.write(err))