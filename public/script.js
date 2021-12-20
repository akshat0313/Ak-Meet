const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
  host: '/',
  port: '443'
})
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
   
      setTimeout(connectToNewUser,1000,userId,stream) 
    
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

  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom()
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
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


// async function startCapture(displayMediaOptions) {
//   let captureStream = null;

//   try {
//     captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
//   } catch(err) {
//     console.error("Error: " + err);
//   }
//   return captureStream;
// }

// try {
//   videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
//   dumpOptionsInfo();
//   document.getElementById("start").innerHTML="Stop Sharing";
//   // document.getElementById("start").id="stop";
//   screenShareState = 1;
//   return false;
// } catch(err) {
//   console.error("Error: " + err);
// }

//the old one is above

var screenShareState = 0;

async function startCapture() {
  logElem.innerHTML = "";


  try {
    isScreenShare = true;
    navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then((stream)=>{
        captureStream = stream;
        socket.emit('ScreenShared', peerid)
        const [track] = stream.getVideoTracks();
        track.addEventListener('ended', () => stopScrrenShare());
        dumpOptionsInfo();
        document.getElementById("start").innerHTML="Stop Sharing";
    }).catch((err)=>{
        console.error("Error: " + err);
        stopScrrenShare();
    });
} catch(err) {
    console.error("Error: " + err);
    stopCapture();
}
}


//this is the new async method of streaming


const videoElem = document.getElementById("video");
const logElem = document.getElementById("log");
// const startElem = document.getElementById("start");
// const stopElem = document.getElementById("stop");

// Options for getDisplayMedia()

let captureStream = null;
const screenSharePeer = new Peer(undefined, {})
var peerid ;
var isScreenShare = false;

var displayMediaOptions = {
    video: {
      cursor: "always"
    },
    audio: true
};
// Set event listeners for the start and stop buttons
document.getElementById("scrsh1").addEventListener("click", function(evt) {
  if (screenShareState===0){
    startCapture();
  }
  if (screenShareState===1){
    stopCapture();
  }
}, false);

// document.getElementById("stop").addEventListener("click", function(evt) {
//   stopCapture();
// }, false);

function stopCapture(evt) {
  // let tracks = videoElem.srcObject.getTracks();

  // tracks.forEach(track => track.stop());
  // videoElem.srcObject = null;
 
  // document.getElementById("stop").id="start";
  screenShareState = 0;
  socket.emit('ScreenSharingStopped', peerid)
  let tracks = captureStream.getTracks();
  tracks.forEach(track => track.stop());
  captureStream = null;
  document.getElementById("start").innerHTML="Start Sharing";
  isScreenShare = false;
  return false

}

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];

  console.info("Track settings:");
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info("Track constraints:");
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

function copyurl(){
  var meetURL = window.location.href;
  navigator.clipboard.writeText(meetURL);
  document.getElementById("urlcpy-fn").innerHTML="COPIED!";
}

function clearmodal(){
  document.getElementById("urlcpy-fn").innerHTML="";
}

screenSharePeer.on('open', id => {
  peerid = id;
})

screenSharePeer.on('call', call => {
  call.answer(captureStream)
  call.on('stream', userVideoStream => {
      console.log('connected')
  })
})
