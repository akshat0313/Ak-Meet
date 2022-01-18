const express = require('express')
const session = require('express-session');
const passport = require('passport');
require('./auth');
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
// const ShortUniqueId = require('short-unique-id');
const { ExpressPeerServer } = require('peer');
require('dotenv').config()
var nodemailer = require('nodemailer');
var cron = require('node-cron');
// const short = require('short-uuid');
// const v5 = require('uuid');
var getIdByTime = require('time-uuid/get-by-time');
var getTime = require('time-uuid/time');
var generateId = require('time-uuid');
const SocketIOFile = require('socket.io-file');
let status

// let uid=new ShortUniqueId({ 
//   length: 9,
//   dictionary: 'alpha',
// })

// const translator = short(short.constants.flickrBase58, {
//   consistentLength: true,
// });
// const uid = translator.generate();

let uid = genId();

function genId() {
  var id1 = getIdByTime(getTime())
  var id2 = getIdByTime(getTime())
  var id3 = getIdByTime(getTime())
  var id = ((((id1.substring(0, 3))) + "-" + ((id2.substring(id2.length - 5, id2.length - 1))) + "-" + ((id3.substring(id3.length - 8, id3.length - 5)))) || (((id1.substring(id1.length - 4, id1.length - 1))) + "-" + (id2.substring(id2.length - 9, id2.length - 5)) + "-" + (id3.substring(0, 3))))
  return id
}


const peerServer = ExpressPeerServer(server, {
  debug: true
});

const process = require('process');
const { get } = require('https');
const LeWindows = require('nodemailer/lib/mime-node/le-windows');

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
  // next()
}

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/peerjs', peerServer);

app.get('/google', (req, res) => {
  res.render('login')
  // res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }
  ));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/view',
    failureRedirect: '/auth/google/failure'
  })
);

app.get('/view', isLoggedIn, (req, res) => {
  // uid = (((generateId()).substring(0,3)) || ((generateId()).substring(6,9)))+"-"+(((getIdByTime(getTime())).substring(3,7)) || ((getIdByTime(getTime())).substring(0,4)))+"-"+(((getIdByTime(getTime())).substring(7,10)) || ((getIdByTime(getTime())).substring(4,7)));
  // uid = genId();
  res.render('view', { uid: uid });
  roomId = "";
  userId = "";
  ROOM_ID = "";
})

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('login')
})

app.get('/home', isLoggedIn, (req, res) => {
  res.redirect(`/${uid}`)
})

app.get('/endmeet', (req,res)=>{
  uid = genId();
  res.redirect('/view');
})

app.get('/schedule-meet', isLoggedIn, (req, res) => {
  res.render('schedule', { user: req.user })
})

app.get('/sendMail', isLoggedIn, (req, res) => {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.email, pass: process.env.app_pass }
  });

  var port = (process.env.PORT) ? `${process.env.PORT}` : `3000`
  var meetlink = `localhost:` + port + `/${uid}`

  const htmlText = `
   <div style="background: #f6f8f9; display: flex; justify-content: center; align-items: center; min-height: 460px;">
    <div style="background: #fff; margin: auto; max-width: 500px; padding: 14px; height: 93%; color: #636271;">
      <div style="margin-bottom: 20px; font-size: 22px; font-weight: 600; color: #F5CB5C;">AK Meet</div>
      <p style="font-size: 14px">Hey,</p>
      <p style="font-size: 14px">You have a meeting scheduled! Don't forget to mark you calender, looking forward to see you in the meeting.</p>
      <div style="display: flex; font-size: 14px">
          <div style="font-weight: 600;">Date:</div>
          <div style="margin-left: 5px">${req.query.date} at ${req.query.time}</div>
      </div>
      <div style="display: flex; font-size: 14px">
          <div style="font-weight: 600;">Topic:</div>
          <div style="margin-left: 5px">${req.query.topic}</div>
      </div>
      <div style="display: flex; font-size: 14px">
          <div style="font-weight: 600;">Description:</div>
          <div style="margin-left: 5px">${req.query.description}</div>
      </div>
      <p style="font-size: 14px">The link for the meet is <a href="${meetlink}" style="color: #3968d2; cursor: pointer;">${meetlink}</a></p>
      <p style="font-size: 14px">Please join the meet on time</p>
      <p style="font-size: 14px">
          <p style="font-size: 14px; margin-bottom: 0">Cheers,</p>
          <p style="font-size: 14px; margin-top: 2px">${req.user.displayName}</p>
      </p>
      <p style="font-size: 13px;">This is a computer generated mail. Another reminder mail will be sent to you before
          the meeting
      </p>
    </div>
  </div>
`
  var mailOptions = {
    from: process.env.email,
    to: `${req.query.reciever}, ${req.user.email}`,
    subject: `Scheduled Meeting on the topic ${req.query.topic}`,
    text: `A meeting is scheduled by ${req.user.displayName} on ${req.query.date}` +
      ` at ${req.query.time} on the topic of ${req.query.topic}. 
The link for the meet is ${meetlink}.
Please Join the meet on time.
This is a computer generated Mail. Another reminder mail will be sent to you before the meeting`,
    html: htmlText
  };

  transporter.sendMail(mailOptions);
  console.log(req.query.date)

  var date = req.query.date.split("-")
  var time = req.query.time.split(":")

  cron.schedule(`${time[0]} ${time[1]} ${date[2]} ${date[1]} *`, () => {
    transporter.sendMail(mailOptions);
  });

  res.redirect(`/view`)
})

app.get('/:room', isLoggedIn, (req, res) => {
  if (req.params.room === uid) {
    res.render('room', { roomId: req.params.room, userName: req.user.displayName })
  } else {
    status = 501
    res.render('error', { code: status })
  }
})

app.get('/error', (req, res) => {
  res.render('error', { code: status })
})

// app.get('/logout', function(req, res) {
//     req.session.destroy(function(e){
//         req.logout();
//         res.redirect('/');
//     });
// });

app.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate..');
  res.send('<a href="/auth/google">Authenticate with Google</a>');
  res.render('login');
});

var ObjectListofALL = {}

io.on('connection', socket => {

  socket.on('join-room', async (roomId, userId, userNameOrignal) => {

    socket.to(roomId).emit('RoomDetailsResponse', ObjectListofALL[roomId])

    await socket.join(roomId)

    const userInfo = { "PeerID": userId, "Name": userNameOrignal };

    if (!ObjectListofALL[roomId]) {
      ObjectListofALL[roomId] = [userInfo];
    }

    socket.to(roomId).emit('user-let-in', userId, userNameOrignal)

    socket.on('UsercanJoin', (userId1) => {
      ObjectListofALL[roomId].push(userInfo);
      io.to(roomId).emit('user-connected', userId1)
    })

    socket.on('UsercantJoin', (userId1) => {
      socket.to(roomId).emit('RemoveParticipant', userId1)
    })

    // messages
    socket.on('message', (message) => {
      //send message to the same room
      console.log(message)
      io.to(roomId).emit('createMessage', message, userNameOrignal)
    });
    //whiteboard
    socket.on('canvas-data', (data) => {
      socket.broadcast.emit('canvas-data', data);

    })

    socket.on('ScreenShared', (peerid) => {
      io.to(roomId).emit('viewScreen', peerid)
      ObjectListofALL[roomId].push({ "PeerID": peerid, "Name": `${userNameOrignal}'s screen`, "isScreen": true });
    })

    socket.on('ScreenSharingStopped', (peerid) => {
      io.to(roomId).emit('user-disconnected', peerid)
      ObjectListofALL[roomId] = ObjectListofALL[roomId].filter((val) => val != { "PeerID": peerid, "Name": `${userNameOrignal}'s screen`, "isScreen": true })
    })

    socket.on('RoomDetailsRequest', () => {
      socket.emit('RoomDetailsResponse', ObjectListofALL[roomId])
    })

    socket.on("MuteOrder", (peerID) => {
      io.to(roomId).emit('MuteParticipant', peerID)
    })

    socket.on("RemoveOrder", (peerID) => {
      io.to(roomId).emit('RemoveParticipant', peerID)
    })
    
        var uploader = new SocketIOFile(socket, {
      // uploadDir: {			// multiple directories
      // 	music: 'data/music',
      // 	document: 'data/document'
      // },
      uploadDir: 'data',							// simple directory
      accepts: ['audio/mpeg', 'audio/mp3'],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
      maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
      chunkSize: 10240,							// default is 10240(1KB)
      transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
      overwrite: true 							// overwrite file if exists, default is true.
  });
  uploader.on('start', (fileInfo) => {
      console.log('Start uploading');
      console.log(fileInfo);
  });
  uploader.on('stream', (fileInfo) => {
      console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
  });
  uploader.on('complete', (fileInfo) => {
      console.log('Upload Complete.');
      console.log(fileInfo);
  });
  uploader.on('error', (err) => {
      console.log('Error!', err);
  });
  uploader.on('abort', (fileInfo) => {
      console.log('Aborted: ', fileInfo);
  });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
      ObjectListofALL[roomId] = ObjectListofALL[roomId].filter((val) => val != userInfo)
    })

  })
})

server.listen(process.env.PORT || 3000)
