let captureStream = null;
const screenSharePeer = new Peer(undefined, {})
var peerid ;
var isScreenShare = false;

var displayMediaOptions = {
    video: {
      cursor: "always"
    },
    audio: false
};
  

const startScreenShare = () => {
    if(isScreenShare){
        return stopScrrenShare()
    }
    try {
        isScreenShare = true;
        navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then((stream)=>{
            captureStream = stream;
            socket.emit('ScreenShared', peerid)
            const [track] = stream.getVideoTracks();
            track.addEventListener('ended', () => stopScrrenShare());
        }).catch((err)=>{
            console.error("Error: " + err);
            stopScrrenShare();
        });
        document.getElementsByClassName("fas fa-desktop")[0].style.color = "red";
    } catch(err) {
        console.error("Error: " + err);
        stopScrrenShare();
    }
}


function stopScrrenShare(){
    socket.emit('ScreenSharingStopped', peerid)
    let tracks = captureStream.getTracks();
    tracks.forEach(track => track.stop());
    captureStream = null;
    document.getElementsByClassName("fas fa-desktop")[0].style.color = "";
    isScreenShare = false;
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
