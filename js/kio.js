
// connect to the socket server
var socket = io.connect('http://52.88.79.218:3000'); 


// if we get an "info" emit from the socket server then console.log the data we recive
socket.on('info', function (data) {
    console.log(data.msg);
});


document.getElementById("close").addEventListener("click", function(){socket.disconnect();});
