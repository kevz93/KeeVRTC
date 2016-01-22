"use strict";
document.addEventListener('DOMContentLoaded', function() {

    // DOM elements manipulated as user interacts with the app
    var messageBox = document.querySelector('#messages');
    var remoteVideo = document.querySelector('#remoteVideo');
    var localVideo = document.querySelector('#localVideo');
    //----------------Design elements : ------------------
    var panel = document.querySelector('#rightpanel');
    var glasspanel = document.querySelector('#glasspanel');

    var middle = document.querySelector('#middle');
    var middlewidth = middle.offsetWidth;
    // -----------------------------------Volume for remote video-------------------
    var currentVolume = 0.5;
    $("#volume").slider({
        min: 0,
        max: 100,
        value: 50,
        range: "min",
        animate: true,
        slide: function(event, ui) {
            setVolume((ui.value) / 100);
        }
    });

    //localVideo.volume = 0;
    //--------------------------------------------------------pan tilt sliders/UI element
    $("#pantiltXSlider").slider({
        min: 0,
        max: 100,
        value: 50,
        range: "min",
        animate: true,
        slide: function(event, ui) {
            console.log('slider value : ' + ui.value);
        }
    });
    $("#pantiltYSlider").slider({
        orientation: "vertical",
        min: 0,
        max: 100,
        value: 50,
        range: "min",
        animate: true,
        slide: function(event, ui) {
            console.log('slider value : ' + ui.value);
        }
    });
    //----------------------------------------------------Volume
    function setVolume(myVolume) {
        console.log('Volume @' + myVolume);
        currentVolume = myVolume;
        remoteVideo.volume = myVolume;
    }
    //----------------------------------------------

    // var canvas = document.createElement('canvas');
    // var ctx = canvas.getContext('2d');
    // canvas.setAttribute('width', 640);
    // canvas.setAttribute('height',400);

    // function snapshot() {
    //   if (localStream) {
    //     ctx.drawImage(localVideo, 0, 0); 
    //     // "image/webp" works in Chrome.
    //     // Other browsers will fall back to image/png.
    //     //document.querySelector('img').src = canvas.toDataURL('image/webp');
    //     var imageData = canvas.toDataURL('image/webp');
    //     send({snap: imageData});
    //   }
    // }

    var glasspanelwidth = glasspanel.offsetWidth;
    var panelwidth = glasspanelwidth;

    var viewportwidth;
    var viewportheight;

    if (typeof window.innerWidth != 'undefined') {
        viewportwidth = window.innerWidth,
            viewportheight = window.innerHeight
    }

    document.getElementById("rightpanel").style.width = glasspanelwidth + "px";
    document.getElementById("rightpanel").style.height = viewportheight + "px";
    glasspanel.style.height = viewportheight + "px";
    //------------------------------------------------------------------------

    document.getElementById("localVideo").style.top = 0.7 * viewportheight + "px";
    document.getElementById("localVideo").style.left = 0.25 * panelwidth + "px";

    //-------------------------------------------------------------------
    document.getElementById("knobX-container").style.width = middlewidth + "px";
    document.getElementById("knobY-container").style.height = 0.6 * viewportheight + "px";



    var sendData = 'nothing';

    //var recipientId = prompt("Enter recipientID");

    var peer = null;
    var dcon = null;

    // the local video stream captured with getUserMedia()
    var localStream = null;
    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function keyboardhandler(event) {
        var key = event.keyCode;
        console.log(key);

        switch (key) {
            case 80:
                send('snap');
                break; //p
            case 219:
                if ((currentVolume + 0.1) > 1) // '['
                    setVolume(1);
                else
                    setVolume(currentVolume + 0.1);
                break;
            case 221:
                if ((currentVolume - 0.1) < 0) // ']'
                    setVolume(0);
                else
                    setVolume(currentVolume - 0.1);
                break;
            case 87:
                send('w');
                break; //w
            case 65:
                send('a');
                break; //a
            case 83:
                send('s');
                break; //s
            case 68:
                send('d');
                break; //d
            case 38:
                send('5');
                break; // up arrow
            case 40:
                send('8');
                break; //down
            case 37:
                send('6');
                break; //left
            case 39:
                send('4');
                break; //right
            case 72:
                send('heart');
                break; //heart H
            case 89:
                send('o');
                break; // yes y 
            case 78:
                send('n');
                break; // no n
            case 67:
                send('v');
                break; // head align
        }
    }

    // DOM utilities
    var makePara = function(text) {
        var p = document.createElement('p');
        p.innerText = text;
        return p;
    };

    var addMessage = function(para) {
        if (messageBox.firstChild) {
            messageBox.insertBefore(para, messageBox.firstChild);
        } else {
            messageBox.appendChild(para);
        }
    };

    var logError = function(text) {
        var p = makePara('ERROR: ' + text);
        p.style.color = 'red';
        addMessage(p);
    };

    var logMessage = function(text) {
        addMessage(makePara(text));
    };

    // -----------------------------------Pantilt slider-------------------
    $("#knobX").css("left", 50 + "%");
    $("#knobY").css("top", 50 + "%");

    function changeXSlider(values) {
        $('#knobX-container').fadeTo( 'fast', 1 );
        $("#knobX").css("left", values + "%");
        $('#knobX-container').fadeTo( 2000, 1 );
    }

    function changeYSlider(values) {
        $('#knobY-container').fadeTo( 'fast' , 1 );
        $("#knobY").css("top", values + "%");
        $('#knobY-container').fadeTo( 2000 , 1 );
    }
    //------------------------------------------------------------
    //------------------------------- wire up button events

    function mousedwn(e) {

        if (e.target !== e.currentTarget) {

            var clickedItem = e.target.id;
            // alert("Hello " + clickedItem); 
            if (e.target.id == 'heart')
                send('heart');
            if (e.target.id == 'yes')
                send('o');
            if (e.target.id == 'no')
                send('n');
            //----           use it to catch any clicks on specific id(s) *drops mic*
            if (e.target.id == "fwdButton")
                send('5');
            if (e.target.id == "revButton")
                send('8');
            if (e.target.id == "leftButton")
                send('6'); //send('4');
            if (e.target.id == "rightButton")
                send('4'); //send('6');
            if (e.target.id == "tiltup")
                send('w');
            if (e.target.id == "tiltdown")
                send('s');
            if (e.target.id == "tiltleft")
                send('d'); //send('a');
            if (e.target.id == "tiltright")
                send('a'); //send('d');
        }
        e.stopPropagation();
    };


    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~WEBRTC CORE SWAG~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var room = 'i2u2bot1';
    var isChannelReady;
    var isInitiator = false;
    var isStarted = false;
    var localStream;
    var pc;
    var dataChannel;
    var remoteStream;
    var turnReady;
    var blockMessage = false;
    var pc_config = {
        'iceServers': [{
            'url': 'stun:stun1.l.google.com:19302'
        }, {
            'url': 'turn:numb.viagenie.ca',
            'credential': '2201234321k',
            'username': 'kevz93g@gmail.com'
        }]
    };
    var dataOptions = null;
    var pc_constraints = {
        'optional': [{
            'DtlsSrtpKeyAgreement': true
        }, {
            'RtpDataChannels': false
        }]
    };

    // Set up audio and video regardless of what devices are present.
    var sdpConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
    };

    /////////////////////////////////////////////
    var localVideo = document.querySelector('#localVideo');
    var remoteVideo = document.querySelector('#remoteVideo');

    //var room = location.pathname.substring(1);
    //var room = 'foo';

    var socket = io.connect('https://signalling.i2u2robot.in:7080');

    console.log('Creating or joining room ', room);
    socket.emit('create or join', room);

    socket.emit('callto',{'from':'my butt','to':'kevz93g@gmailcom'});

    socket.on('created', function(data) {
        console.log(data.SocketID + ' created room ' + data.room);
        console.log('This peer is the initiator of room ' + room + '!');
        isInitiator = true;
    });

    socket.on('full', function(room) {
        console.log('Room ' + room + ' is full');
        blockMessage = true;
    });

    socket.on('join', function(room) {
        console.log('Another peer made a request to join room ' + room);

        isChannelReady = true;
        console.log(' isChannelReady updated -->', isChannelReady);

    });

    socket.on('joined', function(data) {
        console.log('The peer ' + data.SocketID + 'has joined room ' + data.room);
        isChannelReady = true;
        console.log('joined isChannelReady', isChannelReady);
    });

    socket.on('log', function(array) {
        console.log.apply(console, array);
    });

    socket.on('joinUpdate', function(data) {
        console.log('NEW :: ' + data)
    });
    ///////////////////////////////////////////////////////////////////

    function sendMessage(message) {
        if (!blockMessage) {
            //console.log('Client sending message: ',message );
            //  if (typeof message === 'object') {
            //    message = JSON.stringify(message);
            //  }

            socket.emit('message', {
                'message': message,
                'room': room
            });
        }
    }
    //////////////////////////////////////////////////////////////////

    socket.on('message', function(message) {
        //console.log('Client received message:', message);
        if (message === 'got user media') {
            console.log(' Got user media message');
            maybeStart();
        } else if (message.type === 'offer') {
            console.log('got message.type OFFER');
            if (!isInitiator && !isStarted) {
                maybeStart();
            }
            pc.setRemoteDescription(new RTCSessionDescription(message));
            doAnswer();
        } else if (message.type === 'answer' && isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        } else if (message === 'bye' && isStarted) {
            handleRemoteHangup();
        }
    });

    ////////////////////////////////////////////////////


    function handleUserMedia(stream) {
        console.log('Getting user media with constraints', constraints);
        console.log('Adding local stream.');
        localVideo.src = window.URL.createObjectURL(stream);
        localStream = stream;
        console.log('Sending Got user media !');
        sendMessage('got user media');
        if (isInitiator) {
            maybeStart();
        }
    }

    function handleUserMediaError(error) {
        console.log('getUserMedia error: ', error);
    }

    var constraints = {
        video: true,
        audio: true
    };

    getUserMedia(constraints, handleUserMedia, handleUserMediaError);


    if (location.hostname != "localhost") {
        requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
    }

    function maybeStart() {
        console.log('In maybestart() isStarted :' + isStarted + ' local stream : ' + localStream + 'isChannelReady' + isChannelReady);

        if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
            createPeerConnection();
            pc.addStream(localStream);
            console.log('pc.addstream done!');
            isStarted = true;
            console.log('isStarted : ', isStarted);
            console.log('isInitiator : ', isInitiator);
            if (isInitiator) {
                console.log('Calling');
                doCall();

            }
        }
    }

    window.onbeforeunload = function() {
        sendMessage('bye');
        return null;
    }

    /////////////////////////////////////////////////////////

    function createPeerConnection() {
        try {
            pc = new RTCPeerConnection(pc_config, pc_constraints);
            pc.onicecandidate = handleIceCandidate;
            console.log('Created RTCPeerConnnection with:\n' +
                '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
                '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;

        if (isInitiator) {
            try {
                // Reliable Data Channels not yet supported in Chrome
                dataChannel = pc.createDataChannel("sendDataChannel", dataOptions);

                dataChannel.onmessage = handleMessage;
                trace('Created send data channel');
            } catch (e) {
                alert('Failed to create data channel. ' +
                    'You need Chrome M25 or later with RtpDataChannel enabled');
                trace('createDataChannel() failed with exception: ' + e.message);
            }
            dataChannel.onopen = handleSendChannelStateChange;
            dataChannel.onclose = handleSendChannelStateChange;
        } else {
            pc.ondatachannel = gotReceiveChannel;
        }
    }

    function gotReceiveChannel(event) {
        trace('Receive Channel Callback');
        dataChannel = event.channel;
        dataChannel.onmessage = handleMessage;
        dataChannel.onopen = handleReceiveChannelStateChange;
        dataChannel.onclose = handleReceiveChannelStateChange;
    }

    var arrayToStoreChunks= [];
    var data;
    function handleMessage(event) {
    if(typeof JSON.parse(event.data) =='object')
    {
    console.log('Recieved Object : ');
    data = JSON.parse(event.data);
     }
    else
    {   console.log('Recieved no Object');
    data = event.data;
    }
    if(data.snap)
    {   
        console.log("snap")  ;
        arrayToStoreChunks.push(data.message); // pushing chunks in array

    if (data.last)
      {
        console.log('Saving to disk');
        saveToDisk(arrayToStoreChunks.join(''), 'i2u2Snap');
        arrayToStoreChunks = []; // resetting array
      }
    } 
    else {
            console.log('Recieved data : ' + data);
            var trimHead, bool, trimTail;

            for (var i = 0, len = data.length; i < len; i++)
                if (data.charAt(i) == '{') {
                    trimHead = i;
                    bool = 1;
                } else if ((data.charAt(i) == '}') && (bool == 1)) {
                trimTail = i;
                bool = 0;
                break;
            }

            var trimAndroidPacket = data.substring(trimHead, trimTail + 1);
            console.log('Recieved :' + data + ':: trimmed : ' + trimAndroidPacket);
            var AndroidObject = JSON.parse(trimAndroidPacket);


            var pan = Math.round(((AndroidObject.x) / 179) * 100);
            var tilt = Math.round(((AndroidObject.y - 110) / 69) * 100);

            console.log('AndroidObjectX : ' + AndroidObject.x + '::AndroidObjectY : ' + AndroidObject.y);
            console.log('Pan : ' + pan + ':: Tilt :' + tilt);

            changeXSlider(100 - pan);
            changeYSlider(100 - tilt);
        }
    }
  function saveToDisk(fileUrl, fileName){
    console.log("saving image");
  var save = document.createElement('a');
    save.href = fileUrl;
    save.target = '_blank';
    save.download = fileName || fileUrl;

    var event = document.createEvent('Event');
    event.initEvent('click', true, true);

    save.dispatchEvent(event);
    (window.URL || window.webkitURL).revokeObjectURL(save.href);
}
    function handleSendChannelStateChange() {
        var readyState = dataChannel.readyState;
        //send('Hello world!');
        trace('Send channel state is: ' + readyState);
    }

    function handleReceiveChannelStateChange() {
        var readyState = dataChannel.readyState;
         //send('Hello back!'});
        trace('Receive channel state is: ' + readyState);
    }


    function handleIceCandidate(event) {
        // console.log('handleIceCandidate event: ', event);
        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    }


    function handleCreateOfferError(event) {
        console.log('createOffer() error: ', e);
    }

    function handleCreateAnswerError(error) {
        console.log('createAnswer() error: ', error);
    }

    function doCall() {
        console.log('Sending offer to peer');
        pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    function doAnswer() {
        console.log('Sending answer to peer.');
        pc.createAnswer(setLocalAndSendMessage, handleCreateAnswerError, sdpConstraints);
    }

    function setLocalAndSendMessage(sessionDescription) {
        // Set Opus as the preferred codec in SDP if Opus is present.
        sessionDescription.sdp = preferOpus(sessionDescription.sdp);
        pc.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        sendMessage(sessionDescription);
    }

    function requestTurn(turn_url) {
        var turnExists = false;
        for (var i in pc_config.iceServers) {
            if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
                turnExists = true;
                turnReady = true;
                break;
            }
        }
        if (!turnExists) {
            console.log('Getting TURN server from ', turn_url);
            // No TURN server. Get one from computeengineondemand.appspot.com:
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var turnServer = JSON.parse(xhr.responseText);
                    console.log('Got TURN server: ', turnServer);
                    pc_config.iceServers.push({
                        'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
                        'credential': turnServer.password
                    });
                    turnReady = true;
                }
            };
            xhr.open('GET', turn_url, true);
            xhr.send();
        }
    }

    function handleRemoteStreamAdded(event) {
        console.log('Remote stream added.');
        remoteVideo.src = window.URL.createObjectURL(event.stream);
        remoteStream = event.stream;
        remoteVideo.style.opacity = 1;
        $('#knobX-container').fadeTo( 3000 , 1 );
        $('#knobY-container').fadeTo( 3000 , 1 );
        $('#knobX-container').fadeTo( 3000 , 0.33 );
        $('#knobY-container').fadeTo( 3000 , 0.33 );
    }

    function handleRemoteStreamRemoved(event) {
        console.log('Remote stream removed. Event: ', event);
        remoteVideo.style.opacity = 0;
        $('#knobX-container').fadeTo( 3000 , 0 );
        $('#knobY-container').fadeTo( 3000 , 0 );
    }

    function hangup() {
        console.log('Hanging up.');
        stop();
        sendMessage('bye');
    }

    function handleRemoteHangup() {
        isInitiator = true;
        isStarted = false;
        console.log('Session terminated.');
        stop();
    }

    function stop() {
        isStarted = false;
        remoteVideo.style.opacity = 0;
        $('#knobX-container').fadeTo( 3000 , 0 );
        $('#knobY-container').fadeTo( 3000 , 0 );
        dataChannel.close();
        pc.close();
        pc = null;
    }


    ///////////////////////////////////////////

    // Set Opus as the default audio codec if it's present.
    function preferOpus(sdp) {
        var sdpLines = sdp.split('\r\n');
        var mLineIndex;
        // Search for m line.
        for (var i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('m=audio') !== -1) {
                mLineIndex = i;
                break;
            }
        }
        if (mLineIndex === null) {
            return sdp;
        }

        // If Opus is available, set it as the default in m line.
        for (i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('opus/48000') !== -1) {
                var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
                if (opusPayload) {
                    sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
                }
                break;
            }
        }

        // Remove CN in m line and sdp.
        sdpLines = removeCN(sdpLines, mLineIndex);

        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    function extractSdp(sdpLine, pattern) {
        var result = sdpLine.match(pattern);
        return result && result.length === 2 ? result[1] : null;
    }

    // Set the selected codec to the first in m line.
    function setDefaultCodec(mLine, payload) {
        var elements = mLine.split(' ');
        var newLine = [];
        var index = 0;
        for (var i = 0; i < elements.length; i++) {
            if (index === 3) { // Format of media starts from the fourth.
                newLine[index++] = payload; // Put target payload to the first.
            }
            if (elements[i] !== payload) {
                newLine[index++] = elements[i];
            }
        }
        return newLine.join(' ');
    }

    // Strip CN from sdp before CN constraints is ready.
    function removeCN(sdpLines, mLineIndex) {
        var mLineElements = sdpLines[mLineIndex].split(' ');
        // Scan from end for the convenience of removing an item.
        for (var i = sdpLines.length - 1; i >= 0; i--) {
            var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
            if (payload) {
                var cnPos = mLineElements.indexOf(payload);
                if (cnPos !== -1) {
                    // Remove CN payload from m line.
                    mLineElements.splice(cnPos, 1);
                }
                // Remove CN line in sdp
                sdpLines.splice(i, 1);
            }
        }

        sdpLines[mLineIndex] = mLineElements.join(' ');
        return sdpLines;
    }

    function send(sendData) {
        if (dataChannel.readyState == 'open'){
            if(typeof sendData =='object'){
                dataChannel.send(JSON.stringify(sendData));
         }
            else                                
            dataChannel.send(sendData);
        }
    }

    function stopmoving(){
        send('q');
    }

    //------------------------------------------------------------------------------------------------------------------------------------------------------------------
    $(document).ready(function() {
        window.addEventListener("keydown", keyboardhandler, false);
        window.addEventListener("keyup",stopmoving, false);
        $("#rightpanel").mousedown(mousedwn).mouseup(function() {
            send("q");
        });
        //--------------Mouse events ------------------------
      $("#endcall").click(hangup);
      $("#snap").on("click", function() {
        send('snap');
       });
        $("#left-panel").mousedown(mousedwn).mouseup(function() {
            send("q");
        });
         $("#headAlign").mousedown(send('v'));
         $('[data-toggle="tooltip"]').tooltip({
      position: {
        my: "center bottom-0",
        at: "center top",
        using: function( position, feedback ) {
          $( this ).css( position );
          $( "<div>" )
            .addClass( "arrow" )
            .addClass( feedback.vertical )
            .addClass( feedback.horizontal )
            .appendTo( this );
        }
      }
    }); 
        //$("body").tooltip({ selector: '[data-toggle = "tooltip"]' });
   });


});
