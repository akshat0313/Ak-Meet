socket = io()

const videoGrid = document.getElementById('video-grid')

const myPeer = new Peer(undefined, {})
var myPeerID;
var myRoomDetails;

let myVideoStream;

const myVideo = document.createElement('video')

myVideo.muted = true;

const peers = {}

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  
  myVideoStream = stream;

  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })
  
  socket.on('user-connected', userId => {
    console.log('user-connected')
    connectToNewUser(userId, stream) 
  }) 
  
  socket.on('viewScreen', userId => {
    console.log('screen-shared')
    connectToNewUser(userId, stream) 
  }) 
  
  // input value
  let text = $("input");
  
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });
  
  socket.on("createMessage", (message,userName) => {
    var date = new Date();
    let hour = date.getHours();
    if(hour<10){
      hour = hour.toString();
      hour = "0"+hour;
    }
    let minutes = date.getMinutes();
    if(minutes<10){
      minutes = minutes.toString();
      minutes = "0"+minutes;
    }
    $("ul").append(`<li class="message"><b>${userName}</b><br/>${message}<div style='text-align: right; font-size: xx-small; color:grey; width:90%'>${hour}:${minutes}</div></li>`);
    scrollToBottom()
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  myPeerID = id;
  socket.emit('join-room', ROOM_ID, id, user_name_google)
  myRoomDetails = [{"PeerID":myPeerID,"Name":user_name_google}]
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })
  
  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}



const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

function copylink(){
  navigator.clipboard.writeText(window.location.href);
  document.getElementById('copyLinkText2').innerHTML = "Copied";
  document.getElementById('copyLinkText1').style.backgroundColor = "green"
  setTimeout(()=>{
    document.getElementById('copyLinkText2').innerHTML = "Copy Meeting Link";
    document.getElementById('copyLinkText1').style.backgroundColor = "rgba(68, 68, 224, 0.911)"
  }, 1000);
}

function ShowParticipants(){
  document.getElementById('ShowParticipantsButton').click()
  socket.emit('RoomDetailsRequest')
}


socket.on('RoomDetailsResponse',(roomDetils)=>{
  document.getElementById('ParticipantsListMain').innerHTML = ''
  roomDetils.forEach((value)=>{
    document.getElementById('ParticipantsListMain').innerHTML += `<div style="width: auto; padding: 10px;">
    ${value.Name}<i class="fas fa-thumbtack"></i><i class="fas fa-microphone-slash"></i></div>`
  })
})
