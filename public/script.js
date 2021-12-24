socket = io()

const videoGrid = document.getElementById('video-grid')

const myPeer = new Peer(undefined, {})

let myVideoStream;

const myVideo = document.createElement('video')

myVideo.muted = true;
let writeMode=1; //1 for pen , 0 for eraser
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

  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom()
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
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

const board = () => {
  wb = document.querySelector("#sketch");
  if (wb.style.display==="none") {
    wb.style.display="block";
    document.querySelector("#video-grid").style.display="none";
    drawOnCanvas();
  }
  else{
    wb.style.display="none";
    document.querySelector("#video-grid").style.display="grid";
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

var canvas = document.querySelector('#board');
this.ctx = canvas.getContext('2d');
function drawOnCanvas() {
    var ctx = this.ctx;

    var sketch = document.querySelector('#sketch');
    var sketch_style = getComputedStyle(sketch);
    canvas.width = 1100;
    canvas.height = 500;

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
function copyurl(){
  var meetURL = window.location.href;
  navigator.clipboard.writeText(meetURL);
  document.getElementById("urlcpy-fn").innerHTML="COPIED!";
}

function clearmodal(){
  document.getElementById("urlcpy-fn").innerHTML="";
}
