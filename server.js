const express = require('express')
const session = require('express-session');
const passport = require('passport');
require('./auth');
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer');
require('dotenv').config()
var nodemailer = require('nodemailer');
var cron = require('node-cron');

const peerServer = ExpressPeerServer(server, {
  debug: true
});

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
  passport.authenticate('google', { scope: [ 'email', 'profile' ] }
));

app.get( '/auth/google/callback',
  passport.authenticate( 'google', {
    successRedirect: '/view',
    failureRedirect: '/auth/google/failure'
  })
);

app.get('/view', isLoggedIn, (req,res) => {
  res.render('view');
  roomId="";
  userId="";
  ROOM_ID="";
})

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/',  (req, res) => {
    res.render('login')
  })

app.get('/home', isLoggedIn, (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/schedule-meet', isLoggedIn, (req,res)=>{
  res.render('schedule',{user:req.user})
})

app.get('/sendMail',isLoggedIn, (req,res)=>{

  var transporter = nodemailer.createTransport({service: 'gmail', 
  auth: {user: process.env.email,pass: process.env.app_pass}});
  
  var port =  (process.env.PORT) ? `${process.env.PORT}` : `3000`
  var meetlink =  `localhost:` + port + `/${uuidV4()}`

  var mailOptions = {
    from: process.env.email,
    to: `${req.query.reciever}, ${req.user.email}`,
    subject: `Scheduled Meeting on the topic ${req.query.topic}`,
    text: `A meeting is scheduled by ${req.user.displayName} on ${req.query.date}`+
          ` at ${req.query.time} on the topic of ${req.query.topic}. 
The link for the meet is ${meetlink}.
Please Join the meet on time.
This is a computer generated Mail. Another reminder mail will be sent to you before the meeting`
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
    res.render('room', { roomId: req.params.room, userName: req.user.displayName })
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

  socket.on('join-room', (roomId, userId, userNameOrignal) => {
    
    const userInfo = {"PeerID":userId,"Name":userNameOrignal};

    if(ObjectListofALL[roomId]){
      ObjectListofALL[roomId].push(userInfo);
    }else{
      ObjectListofALL[roomId] = [userInfo];
    }

    socket.join(roomId)

    socket.to(roomId).emit('user-connected', userId)
    
        // messages
    socket.on('message', (message) => {
        //send message to the same room
        console.log(message)
        io.to(roomId).emit('createMessage', message, userNameOrignal)
    });

    socket.on('ScreenShared',(peerid)=>{
      io.to(roomId).emit('viewScreen', peerid)
      ObjectListofALL[roomId].push({"PeerID":peerid,"Name":`${userNameOrignal}'s screen`,"isScreen":true});
    })

    socket.on('ScreenSharingStopped',(peerid)=>{
      io.to(roomId).emit('user-disconnected', peerid)
      ObjectListofALL[roomId] = ObjectListofALL[roomId].filter((val)=> val!={"PeerID":peerid,"Name":`${userNameOrignal}'s screen`,"isScreen":true})
    })

    socket.on('RoomDetailsRequest',()=>{
      socket.emit('RoomDetailsResponse',ObjectListofALL[roomId])
    })

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
      ObjectListofALL[roomId] = ObjectListofALL[roomId].filter((val)=> val!=userInfo)
    })
  })
})

server.listen( process.env.PORT || 3000)
