var Peer = window.SimplePeer;
var socket1 = io.connect();

var initiateBtn = document.getElementById('initiateBtn');
var stopBtn = document.getElementById('stopBtn');
var initiator = false;

const stunServerConfig = {
  iceServers: [{
    url: 'turn:13.250.13.83:3478?transport=udp',
    username: "123456",
    credential: "123456"
  }]
};

initiateBtn.onclick = (e) => {
  initiator = true;
  socket1.emit('initiate');
}

stopBtn.onclick = (e) => {
  socket1.emit('initiate');
}

socket1.on('initiate', () => {
  startStream();
  initiateBtn.style.display = 'none';
  stopBtn.style.display = 'block';
})

function startStream () {
  if (initiator) {
    // get screen stream
    navigator.mediaDevices.getUserMedia({
      video: {
        mediaSource: "screen",
        width: { max: '1920' },
        height: { max: '1080' },
        frameRate: { max: '240' }
      }
    }).then(gotMedia);
  } else {
    gotMedia(null);
  }
}

function gotMedia (stream) {
  if (initiator) {
    var peer = new Peer({
      initiator,
      stream,
      config: stunServerConfig
    });
  } else {
    var peer = new Peer({
      config: stunServerConfig
    });
  }

  peer.on('signal', function (data) {
    socket1.emit('offer', JSON.stringify(data));
  });

  socket1.on('offer', (data) => {
    peer.signal(JSON.parse(data));
  })

  peer.on('stream', function (stream) {
    // got remote video stream, now let's show it in a video tag
    var iframe = document.querySelector('iframe');
    video.srcObject = stream;
    video.play();
  })
}
