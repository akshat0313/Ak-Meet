const express = require('express')
const session = require('express-session');
const passport = require('passport');
require('./auth');
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
  debug: true
});

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
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

app.get('/view', (req, res) => {
  res.render('view');
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
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', isLoggedIn, (req, res) => {
  res.render('room', { roomId: req.params.room })
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

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)

    // messages
    socket.on('message', (message) => {
      //send message to the same room
      console.log(message)
      io.to(roomId).emit('createMessage', message)
    });
    //Whiteboard
    socket.on('canvas-data', (data) => {
      socket.broadcast.emit('canvas-data', data);

    })

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(process.env.PORT || 3000)
