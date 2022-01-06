socket = io()

const videoGrid = document.getElementById('video-grid')

const myPeer = new Peer(undefined, {})
var myPeerID;
var myRoomDetails;
var admin = false;
var joinedParticipantID;

let myVideoStream;

const myVideo = document.createElement('video')

myVideo.muted = false;

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

  socket.on('user-let-in', (userId, userName) => {
    if (admin) {
      document.getElementById('userJoinedPermisson').click();
      joinedParticipantID = userId;
      document.getElementById('modalContent').innerHTML = `${userName} has joined the meeting`;
    }
  })

  document.getElementById('PermissionAccepted').onclick = () => {
    if (joinedParticipantID) {
      socket.emit('UsercanJoin', joinedParticipantID)
    }
    joinedParticipantID = null;
  }

  document.getElementById('PermissionDenied').onclick = () => {
    if (joinedParticipantID) {
      socket.emit('UsercantJoin', joinedParticipantID)
    }
    joinedParticipantID = null;
  }

  socket.on('user-connected', userId => {
    console.log('user-connected')
    if (userId != myPeerID) {
      // setTimeout(connectToNewUser,3000,userId,stream)
      connectToNewUser(userId, stream)
    }
  })
  socket.on("canvas-data", function(data){
  
    var root = this;
    var interval = setInterval(function(){
        if(root.isDrawing) return;
        root.isDrawing = true;
        clearInterval(interval);
        var image = new Image();
        var canvas = document.querySelector('#board');
        var ctx = canvas.getContext('2d');
        image.onload = function() {
            ctx.drawImage(image, 0, 0);
  
            root.isDrawing = false;
        };
        image.src = data;
    }, 200)
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

  socket.on("createMessage", (message, userName) => {
    var date = new Date();
    let hour = date.getHours();
    if (hour < 10) {
      hour = hour.toString();
      hour = "0" + hour;
    }
    let minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = minutes.toString();
      minutes = "0" + minutes;
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
  myVideo.id = id
  socket.emit('join-room', ROOM_ID, id, user_name_google)
  myRoomDetails = [{ "PeerID": myPeerID, "Name": user_name_google }]
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  video.id = userId
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
const board = () => {
  wb = document.querySelector("#sketch");
  if (wb.style.display==="none") {
    wb.style.display="block";
    document.querySelector("#video-grid").style.display="none";
    document.querySelector("#wbShowHide").classList.add("bg-yellow");
    drawOnCanvas();
  }
  else{
    wb.style.display="none";
    document.querySelector("#video-grid").style.display="grid";
    document.querySelector("#wbShowHide").classList.remove("bg-yellow");
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
  `
  document.querySelector('.main__mute_button').classList.remove('bg-yellow');
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
  `
  document.querySelector('.main__mute_button').classList.add('bg-yellow');
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
  `
  document.querySelector('.main__video_button').classList.remove('bg-yellow');
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
  `
  document.querySelector('.main__video_button').classList.add('bg-yellow');
  document.querySelector('.main__video_button').innerHTML = html;
}

function copylink() {
  navigator.clipboard.writeText(ROOM_ID);
  document.getElementById('copyLinkText2').innerHTML = "Copied";
  document.getElementById('copyLinkText1').style.backgroundColor = "lightgreen"
  setTimeout(() => {
    document.getElementById('copyLinkText2').innerHTML = "Meeting Details";
    document.getElementById('copyLinkText1').style.backgroundColor = "rgb(255, 255, 255)"
  }, 1000);
}

function ShowParticipants() {
  document.getElementById('ShowParticipantsButton').click()
  socket.emit('RoomDetailsRequest')
}


socket.on('RoomDetailsResponse', (roomDetails) => {
  if (roomDetails[0].PeerID == myPeerID) {
    admin = true;
  }
  document.getElementById('ParticipantsListMain').innerHTML = ''
  roomDetails.forEach((value) => {
    document.getElementById('ParticipantsListMain').innerHTML += `<div style="width: auto; padding: 10px;">
    ${value.Name}<i class="fas fa-minus-circle" onclick="RemoveParticipant('${value.PeerID}')"></i><i class="fas fa-thumbtack" onclick="PinParticipant('${value.PeerID}')"></i><i class="fas fa-microphone-slash" onclick="MuteParticipant('${value.PeerID}')"></i></div>`
  })
})

function PinParticipant(peerID) {

  const PinvideoGrid = document.getElementById('PinVideoGrid')
  const videoGrid = document.getElementById('video-grid')

  if (PinvideoGrid.style.display == "none") {

    PinvideoGrid.style.display = "grid"
    videoGrid.style.display = "none"

    var pinVideo = document.createElement('video')
    pinVideo.style.width = "100%"
    var object = document.getElementById(peerID)
    pinVideo.srcObject = object.srcObject

    pinVideo.addEventListener('loadedmetadata', () => {
      pinVideo.play()
    })

    PinvideoGrid.append(pinVideo)

  } else {
    PinvideoGrid.style.display = "none"
    videoGrid.style.display = "grid"
    PinvideoGrid.innerHTML = ""
  }
}

function MuteParticipant(peerID) {
  socket.emit("MuteOrder", (peerID));
}

socket.on("MuteParticipant", (peerID) => {
  if (peerID == myPeerID) {
    muteUnmute()
  }
})

function RemoveParticipant(peerID) {
  if (admin) {
    socket.emit("RemoveOrder", (peerID));
  } else {
    alert("Only admins can remove participants!")
  }
}

socket.on("RemoveParticipant", (peerID) => {
  if (peerID == myPeerID) {
    alert('You have been Removed from the meeting')
    document.getElementsByClassName("leave_meeting")[0].click()
  }
})


function ShowChatBox() {
  document.querySelector('.main__right').style.display = 'flex';
  document.querySelector('.main__comment_button').classList.add('clr-yellow');
}

function RemoveChatBox() {
  document.querySelector('.main__right').style.display = 'none';
  document.querySelector('.main__comment_button').classList.remove('clr-yellow');
}

function elapsedTimeIntervalRef (){ setInterval(() => {
  displayedElapsedTime = timeAndDateHandling.getElapsedTime(startDate);
  document.getElementById("timest").innerHTML = displayedElapsedTime;
  }, 1000);
}

var canvas = document.querySelector('#board');
this.ctx = canvas.getContext('2d');
function drawOnCanvas() {
    var ctx = this.ctx;

    var sketch = document.querySelector('#sketch');
    var sketch_style = getComputedStyle(sketch);
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='80%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    var mouse = {x: 0, y: 0};
    var last_mouse = {x: 0, y: 0};

    //for clearing the board
    document.getElementById('clr').addEventListener('click', function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, false);

  /* Mouse Capturing Work */
    canvas.addEventListener('mousemove', function(e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;

        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);


    /* Drawing on Paint App */
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'blue';
    // setTimeout(()=>{
    //   ctx.strokeStyle = (writeMode===1)?'blue':'white';  //choose pen or eraser (pen is 1 and eraser is 0)
    // },100)

    canvas.addEventListener('mousedown', function(e) {
        canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', function() {
        canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    var root = this;
    

    var onPaint = function() {
        ctx.beginPath();
        ctx.moveTo(last_mouse.x, last_mouse.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.closePath();
        ctx.stroke();
        if(root.timeout != undefined) clearTimeout(root.timeout);
            root.timeout = setTimeout(function(){
                var base64ImageData = canvas.toDataURL("image/png");
                root.socket.emit("canvas-data", base64ImageData);
            }, 1000)
    };
}

function changeState(mode){
  if (mode===1) {
    ctx.strokeStyle ='blue';
    ctx.lineWidth= 5;
  }
  else{
    ctx.strokeStyle ='white';
    ctx.lineWidth=8;
  }
}

const changeMode = (a) => {
  changeState(a);
}
