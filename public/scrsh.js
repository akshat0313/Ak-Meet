var socket1 = io.connect();
// socket=io.connect();

navigator.mediaDevices.getUserMedia({  
     video: {  
       mediaSource: "screen",  
       width: { max: '640' },  
       height: { max: '480' },   
       frameRate: { max: '10' }  
     }  
   }).then(gotMedia);

   function gotMedia (stream) {  
     var video = document.querySelector('video');  
     video.srcObject = stream;  
     video.play();  
   }

var initiateBtn = document.getElementById('initiateBtn');  
var initiator = false;

initiateBtn.onclick = (e) => {  
  initiator = true;  
  socket1.emit('initiate');  
}