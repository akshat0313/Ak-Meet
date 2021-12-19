let captureStream = null;
const screenSharePeer = new Peer(undefined, {})
var peerid ;

var displayMediaOptions = {
    video: {
      cursor: "always"
    },
    audio: false
  };
  

const startScreenShare = () => {
    try {
        navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then((stream)=>{
            captureStream = stream;
            socket.emit('ScreenShared', peerid)
        });
    } catch(err) {
        console.error("Error: " + err);
    }
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