let start = document.getElementById('start');
let Stop  = document.getElementById('stop');
let mediaRecorder;
let stream ;

start.addEventListener('click', async function(){
    stream = await recordScreen();
    start.style.display = "none";
    Stop.style.display = "";
    let mimeType = 'video/webm';
    mediaRecorder = createRecorder(stream, mimeType);
    let node = document.createElement("p");
    node.style.display = "none";
    node.textContent = "Started recording";
    document.body.appendChild(node);
})

Stop.addEventListener('click', function(){
    mediaRecorder.stop();
    stream.getTracks() .forEach( track => track.stop() );
    start.style.display = "";
    Stop.style.display = "none";
    let node = document.createElement("p");
    node.textContent = "Stopped recording";
    document.body.appendChild(node);
})

async function recordScreen() {
    return await navigator.mediaDevices.getDisplayMedia({
        audio: true, 
        video: true
    });
}

function createRecorder (stream, mimeType) {
  // the stream data is stored in this array
  let recordedChunks = []; 

  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }  
  };
  mediaRecorder.onstop = function () {
     saveFile(recordedChunks);
     recordedChunks = [];
  };

  stream.getVideoTracks()[0].onended = function () {
    Stop.click()
  };

  mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
  return mediaRecorder;
}

function saveFile(recordedChunks){

   const blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    let filename = window.prompt('Enter file name'),
        downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename}.webm`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(blob); // clear from memory
    document.body.removeChild(downloadLink);
}
