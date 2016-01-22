var static = require('node-static');
var http = require('http');
var PORT = 7979;
var file = new(static.Server)();
var app = http.createServer(function(req, res) {
    file.serve(req, res);
}).listen(PORT, function() {
    console.log("listening on the port "+ PORT);
});
var io = require('socket.io').listen(app);


io.sockets.on('connection', function(socket) {
    console.log('Incoming Connection from : ' + socket.id);

    function log() {
        var array = ["SERVER: "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }

    socket.on('message', function(message) {
        console.log('Recieved message : ' + message);

        //socket.emit('message', message); // changed from .broadcast 
        socket.broadcast.to(message.room).emit('message', message.message);
    });

    socket.on('create or join', function(room) {

        var numClients, nClients;
        numClients = io.sockets.adapter.rooms[room];
        var nClients = (typeof numClients !== 'undefined') ? Object.keys(numClients).length : 0; // get no. in room.

        // for (var clientId in numClients) {
        //   console.log(io.sockets.connected[clientId]);
        // }

        log('Room,' + room + ', has ' + nClients + ' client(s)');
        log('Trying to join room : ', room);


        if (nClients == 0) {
            socket.join(room);
            socket.emit('created', {
                'room': room,
                'socketID': socket.id
            });
        } else if (nClients == 1) {
            io.sockets.in(room).emit('join', room); // for all existing users whithin this room
            socket.join(room);
            socket.emit('joined', {
                'room': room,
                'socketID': socket.id
            }); // 
        } else { // max two clients
            socket.emit('full', room);
            socket.emit('joinUpdate', ' client ' + socket.id + ' has not joined room ' + room);
        }


    });

    socket.on("disconnect", function() {
        console.log(socket.id + ' has diconnected :: client no : ');
    });

//--------------------------------Android events----------------------------------------
socket.on("giveMeID", function(id){
    console.log("Replacing id "+socket.id+" with "+id);
    socket.id = id;
    console.log("Now ID is "+socket.id);
});

});