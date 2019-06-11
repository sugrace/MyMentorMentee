let socket;
let socketId;
const localVideo = document.getElementById('localVideo');
const filter = document.querySelector('#filter');
const chat_button = document.getElementById('chat_button');
const screenshare_button = document.getElementById('screenshare_button');
const lock_button = document.getElementById('lock_button');
const Room_Number = document.querySelector('#nav > ul > li:nth-child(2) > a > span');
const chatting_bar = document.getElementById('chatting_bar');
let connections = [];
let inboundStream = null;
let stream_cnt=0;
let video;

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

//checkSignIn();

if (document.location.hash === "" || document.location.hash === undefined) { 

    // create the unique token for this call 
    token =Math.round(Math.random()*10000);
    call_token = "#"+token;

    // set location.hash to the unique token for this call
    document.location.hash = token;
    alert(`Room is created , Your Room_Number is ${token}, `)
    
}else{
    call_token = document.location.hash;
}

Room_Number.innerHTML = 'Room_Number : '+ call_token.split('#')[1];

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        
        localVideo.srcObject = stream
        localVideo.play();
        
        filter.addEventListener('change', (event) => {
            currentFilter = event.target.value
            localVideo.style.filter = currentFilter
            var data={};
            data.currentFilter=currentFilter;
            data.id = socketId
            data.type = 'filter'
            SendData(data)
            event.preventDefault
        })
        
        chatting_bar.addEventListener('click',event =>{
            let message_box = document.querySelector('body > div.container').hidden;
            if(message_box == true ){
                document.querySelector('body > div.container').hidden = false;
                document.querySelector('body > div.chat').hidden = false;
            }else{
                document.querySelector('body > div.container').hidden=true;
                document.querySelector('body > div.chat').hidden = true;
            }
        })

        chat_button.addEventListener('click',event=>{
            let data = {}
            let text = document.getElementById('chat').value;
            let nm = document.createElement('span')
            nm.className='nm'
            nm.innerText = 'me'
            let co = document.createElement('span')
            co.className='co'
            co.innerText = text;
            let tm = document.createElement('span')
            tm.className='tm'
            let chat = document.querySelector('body > div.chat');
            let ul = document.createElement('ul')
            ul.className='from_me'
            let li = document.createElement('li')
            let br = document.createElement('br')
            ul.appendChild(li)
            li.appendChild(nm)
            li.appendChild(co)
            li.appendChild(tm)
            chat.appendChild(ul)
            chat.appendChild(br)
            data.type = 'chat'
            data.text=text;
            SendData(data)
        });
        
        screenshare_button.addEventListener('click', event =>{
            var constraints = {
                video: true,
                audio: true,
            };
            if(screenshare_button.innerHTML == '화면공유'){
                navigator.mediaDevices.getDisplayMedia(constraints).then(screenstream =>{
                    screenshare_button.innerHTML='화면공유중단'
                        stream = screenstream
                         localVideo.srcObject=screenstream;
                         localVideo.play();
                         let screenTrack = screenstream.getVideoTracks()[0];
                         Object.keys(connections).forEach(function(connection) {
                            var sender = connections[connection].getSenders().find(function(s) {
                              return s.track.kind == screenTrack.kind;
                            });
                            console.log('found sender:', sender);
                            sender.replaceTrack(screenTrack);
                          });
                    })
            }else if(screenshare_button.innerHTML == '화면공유중단'){
                navigator.mediaDevices.getUserMedia(constraints).then(videostream =>{
                    screenshare_button.innerHTML='화면공유'
        
                        stream = videostream 
                         localVideo.srcObject=videostream;
                         localVideo.play();
                         let videoTrack = videostream.getVideoTracks()[0];
                         Object.keys(connections).forEach(function(connection) {
                            var sender = connections[connection].getSenders().find(function(s) {
                              return s.track.kind == videoTrack.kind;
                            });
                            console.log('found sender:', sender);
                            sender.replaceTrack(videoTrack);
                          });
                    })
            }
        })
        lock_button.addEventListener('click', event =>{
        socket.emit('request_lock',document.location.hash)
        })


        
        socket = io()

        socket.on('signal', gotMessageFromServer);
        socket.on('connect', function(){
            socket.emit('token_number',call_token);
            socketId = socket.id;
            socket.on('user-exceeded',function(){
                alert('user exceeded!')
            })
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
                        //if(client_socket_ids.indexOf(client_socket_id)<client_socket_ids.indexOf(client_))
                            let channel = connections[client_socket_id].createDataChannel(`chat${client_socket_id}`)
                            connections[client_socket_id].channel = channel
                            channel.onopen = function(event) {
                                console.log(`it is create peer`)
                                //channel.send('it is create peer');
                              }
                              /*channel.onmessage = function(event) {
                                var data = JSON.parse(event.data)
                                console.log(data)
                                document.getElementById(`${data.id}`).style.filter = data.currentFilter;
                                //if(connections[data.id])
                                }*/
                            
                            //Wait for their ice candidate       
                            connections[client_socket_id].onicecandidate = function(event){
                                if(event.candidate != null) {
                                    console.log('SENDING ICE');
                                    socket.emit('signal', client_socket_id, JSON.stringify({'ice': event.candidate}));
                                }
                            }
                            connections[client_socket_id].ondatachannel = function(event) {
                                let channel = event.channel;
                                //connections[client_socket_id].channel = channel
                                
                                  channel.onopen = function(event) {
                                      console.log('it is receive peer')
                                  //channel.send('it is receive peer');
                                }
                                channel.onmessage = function(event) {
                                    var data = JSON.parse(event.data)
                                    console.log(data)
                                    if(data.type == 'filter'){
                                        document.getElementById(`${data.id}`).style.filter = data.currentFilter;
                                    }
                                    else if(data.type =='chat'){
                                        let text = data.text
                                        let nm = document.createElement('span')
                                        nm.className='nm'
                                        nm.innerText = 'others'
                                        let co = document.createElement('span')
                                        co.className='co'
                                        co.innerText = text;
                                        let tm = document.createElement('span')
                                        tm.className='tm'
                                        let chat = document.querySelector('body > div.chat');
                                        let ul = document.createElement('ul')
                                        ul.className='from_others'
                                        let li = document.createElement('li')
                                        let br = document.createElement('br')
                                        ul.appendChild(li)
                                        li.appendChild(nm)
                                        li.appendChild(co)
                                        li.appendChild(tm)
                                        chat.appendChild(ul)
                                        chat.appendChild(br)
                                    }
                                }
                            }
                        
                        connections[client_socket_id].ontrack = function(event){
                            gotRemoteStream(event, client_socket_id)
                        }    
                       
                        stream.getTracks().forEach(function(track) {
                            connections[client_socket_id].addTrack(track, stream);
                          });
                          
                    }
                });
                
                if(count >= 2){
                    connections[id].createOffer().then(function(description){
                        connections[id].setLocalDescription(description).then(function() {
                            socket.emit('signal', id, JSON.stringify({'sdp': connections[id].localDescription}));
                        }).catch(e => console.log(e));        
                    });
                }
            });          
        })    
    }).catch(err => alert(`Can not start the app due to this reason: ${err}`));

function gotMessageFromServer(fromId, message, type) {
        //Make sure it's not coming from yourself
    if(type == 'sdp'){
        if(fromId != socketId) {
            var signal = JSON.parse(message)
                if(signal.sdp){            
                    connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {                
                        if(signal.sdp.type == 'offer') {
                            connections[fromId].createAnswer().then(function(description){
                                connections[fromId].setLocalDescription(description).then(function() {
                                    socket.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
                                }).catch(e => console.log(e));        
                            }).catch(e => console.log(e));
                        }else if(signal.sdp.type == 'answer'){
                           /* connections[fromId].ondatachannel = function(event) {
                                let channel = event.channel;
                                connections[fromId].channel = channel
                                  channel.onopen = function(event) {
                                      console.log('it is receive peer')
                                  //channel.send('it is receive peer');
                                }
                                channel.onmessage = function(event) {
                                    var data = JSON.parse(event.data)
                                    console.log(data)
                                    document.getElementById(`${data.id}`).style.filter = data.currentFilter;
                                }
                            }*/
                        }
                    }).catch(e => console.log(e));
                }
                if(signal.ice) {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
                }                
            }
        }
        else if(type == 'lock'){
            if(message == true){
                alert("Room is deleted in Signaling Server")
                Room_Number.innerHTML="Secret Room"
            }else if(message == false){
                alert("You are not a Room's owner")
            }
        }
}
function gotRemoteStream(event, id) {
    if(stream_cnt==0){
        enlargement_button =document.createElement('button');
        enlargement_button.className ="icon alt fa-laptop";
        enlargement_button.addEventListener('click', (event) => {
        document.getElementById(id).requestFullscreen();
        })
        video  = document.createElement('video'),
        video.setAttribute('id', id);
        div    = document.createElement('div')
        div.className = `embed-responsive embed-responsive-16by9`
        inboundStream = new MediaStream();
        video.srcObject = inboundStream;
        video.className='embed-responsive-item';
        div.appendChild(video);      
        div.appendChild(enlargement_button)
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
function SendData(data) {
    console.log(connections)
 let connection_ids = Object.keys(connections)
    if (connection_ids.length>0) {
        connection_ids.forEach(function(connection_id){
            if(connection_id!=socketId){
            console.log(connections[connection_id])
            connections[connection_id].channel.send(JSON.stringify(data))
            }
        })
    }
}
// 권한없이 url을 통한 우회 접속 시 차단
function checkSignIn() {
    if(!sessionStorage['accessToken']) {
        alert('First, sign in to use the service!!!');
        window.location.replace('index.html');
        return;
    } else {
        //
    }
}
