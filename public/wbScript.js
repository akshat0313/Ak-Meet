socket = io();
document.addEventListener('DOMContentLoaded', (event) => {
    drawOnCanvas();
});

socket.on("canvas-data", function (data) {
    var root = this;
    var interval = setInterval(function () {
        if (root.isDrawing) return;
        root.isDrawing = true;
        clearInterval(interval);
        var image = new Image();
        var canvas = document.querySelector('#board');
        var ctx = canvas.getContext('2d');
        image.onload = function () {
            ctx.drawImage(image, 0, 0);

            root.isDrawing = false;
        };
        image.src = data;
    }, 200)
})

var canvas = document.querySelector('#board');
this.ctx = canvas.getContext('2d');

function drawOnCanvas() {
    var ctx = this.ctx;

    var sketch = document.querySelector('#sketch');
    var sketch_style = getComputedStyle(sketch);
    canvas.width = 1500;
    canvas.height = 500;

    var mouse = { x: 0, y: 0 };
    var last_mouse = { x: 0, y: 0 };

    //for clearing the board
    document.getElementById('clr').addEventListener('click', function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, false);

    /* Mouse Capturing Work */
    canvas.addEventListener('mousemove', function (e) {
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

    canvas.addEventListener('mousedown', function (e) {
        canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', function () {
        canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    var root = this;


    var onPaint = function () {
        ctx.beginPath();
        ctx.moveTo(last_mouse.x, last_mouse.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.closePath();
        ctx.stroke();
        if (root.timeout != undefined) clearTimeout(root.timeout);
        root.timeout = setTimeout(function () {
            var base64ImageData = canvas.toDataURL("image/png");
            root.socket.emit("canvas-data", base64ImageData);
        }, 1000)
    };
}

function changeState(mode) {
    if (mode === 1) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 5;
    }
    else {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8;
    }
}

const changeMode = (a) => {
    changeState(a);
}
