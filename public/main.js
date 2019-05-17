let socket;
let socketId;
const localVideo = document.getElementById('localVideo');
let connections = [];
let inboundStream = null;
let stream_cnt=0;

var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};
let localStream;
//get stream 

let token;
let call_token;
if (document.location.hash === "" || document.location.hash === undefined) { 

    // create the unique token for this call 
    token =Math.round(Math.random()*10000);
    call_token = "#"+token;

    // set location.hash to the unique token for this call
    document.location.hash = token;


}else{
    call_token = document.location.hash;
}







navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {

       

        
        localVideo.srcObject = stream
        localVideo.play();
        socket = io()
        socket.on('signal', gotMessageFromServer);
        socket.on('connect', function(){
            socket.emit('token_number',call_token);
            socketId = socket.id;
            socket.on('user-left', function(id){
                var video = document.getElementById(`${id}`);
                video.parentElement.remove();
                // var parentDiv = video.parentElement;
                // video.parentElement.parentElement.removeChild(parentDiv);
            });
            socket.on('user-joined', function(id, count, client_socket_ids){
                console.log(id, count, client_socket_ids)
                client_socket_ids.forEach(function(client_socket_id) {
                    if(!connections[client_socket_id]){
                        connections[client_socket_id] = new RTCPeerConnection(peerConnectionConfig);
                          
                        
                        let channel = connections[client_socket_id].createDataChannel("chat")
                        connections[client_socket_id].channel = channel
                        channel.onopen = function(event) {
                            channel.send('Hi you!');
                          }
                          channel.onmessage = function(event) {
                            console.log(event.data);
                          }
                        
                        //Wait for their ice candidate       
                        connections[client_socket_id].onicecandidate = function(event){
                            if(event.candidate != null) {
                                console.log('SENDING ICE');
                                socket.emit('signal', client_socket_id, JSON.stringify({'ice': event.candidate}));
                            }
                        }
                            
                        //Wait for their video stream
                        connections[client_socket_id].ontrack = function(event){
                            gotRemoteStream(event, client_socket_id)
                        }    
                        //Add the local video stream
                        stream.getTracks().forEach(function(track) {
                            connections[client_socket_id].addTrack(track, stream);
                          });
                          
                    }
                });

                //Create an offer to connect with your local description
                
                if(count >= 2){
                    connections[id].createOffer().then(function(description){
                        connections[id].setLocalDescription(description).then(function() {
                            // console.log(connections);
                            socket.emit('signal', id, JSON.stringify({'sdp': connections[id].localDescription}));
                        }).catch(e => console.log(e));        
                    });
                }
            });          
        })    
    })
    .catch(err => document.write(err))

function gotMessageFromServer(fromId, message) {

        //Parse the incoming signal
        var signal = JSON.parse(message)
    
        //Make sure it's not coming from yourself
        if(fromId != socketId) {
    
            if(signal.sdp){            
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {                
                    if(signal.sdp.type == 'offer') {
                        connections[fromId].createAnswer().then(function(description){
                            connections[fromId].setLocalDescription(description).then(function() {
                                socket.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
                            }).catch(e => console.log(e));        
                        }).catch(e => console.log(e));
                    }else if(signal.sdp.type == 'answer'){
                        connections[fromId].ondatachannel = function(event) {
                            let channel = event.channel;
                            connections[fromId].channel = channel
                            
                              channel.onopen = function(event) {
                              channel.send('Hi back!');
                            }
                            channel.onmessage = function(event) {
                              console.log(event.data);
                            }
                            console.log(connections)
                        }
                      
                    }
                }).catch(e => console.log(e));
            }
        
            if(signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }                
        }
}
var video = document.createElement('video')
function gotRemoteStream(event, id) {
    if(stream_cnt==0){
        video  = document.createElement('video'),
    video.setAttribute('id', id);
    div    = document.createElement('div')
    div.className = `embed-responsive embed-responsive-16by9`
    inboundStream = new MediaStream();
    video.srcObject = inboundStream;
    video.className='embed-responsive-item';
    //video.muted       = true;
    //video.playsinline = true;
    
    div.appendChild(video);      
    document.getElementById('peerVideo_list').appendChild(div);     
    video.autoplay    = true;  
    }
   

   
        if (stream_cnt<2) {
     
        inboundStream.addTrack(event.track);
        }
        
        stream_cnt++;
    
        if(stream_cnt == 2){
        stream_cnt=0;
    }
}