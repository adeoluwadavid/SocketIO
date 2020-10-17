const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const formatMessage = require('./utils/messages')
const {userJoin,getCurrentUser, userLeave, getRoomUsers} = require('./utils/user')

// Set static folder
app.use(express.static(path.join(__dirname,'public')))

const botName = 'Adewole Bot'

// Run when client connects
io.on('connection', socket=>{
    socket.on('joinRoom', ({username, room})=>{
    const user = userJoin(socket.id,username, room);
    socket.join(user.room);
    // Welcome current user
    // This is for the user
    socket.emit('message', formatMessage(botName,'Welcome to Adewole Chat'))

    // BroadCast when a user connects 
    // The message is for existing users
    socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`))

        // Send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })
   
    //Listen for chatMessage
    socket.on('chatMessage',msg =>{
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })

     // When client disconnects
     socket.on('disconnect',()=>{
         const user = userLeave(socket.id);
         if(user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`))

                // Send users and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            })
         }  
         
         
    })

})

const PORT = 3000 || process.env.PORT

server.listen(PORT,()=> console.log(`Server running on port ${PORT}`))