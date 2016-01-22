"use strict";
document.addEventListener('DOMContentLoaded', function() {
    var userinp = window.prompt("Hey enter any unique name : (ask your friend to enter the same name)","");
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
//var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
//var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

//-----------------------------------------------------------------------------------------------------
var progressHelper = {};
var outputPanel = document.body;
var fileR = new fftory.Receiver(fileHelper); // used in handleMessage()
var fileHelper = {
    onBegin: function (file) {
        console.log('onBegin');
        var div = document.createElement('div');
        div.title = file.name;
        div.innerHTML = '<label>0%</label> <progress></progress>';
        outputPanel.insertBefore(div, outputPanel.firstChild);
        progressHelper[file.uuid] = {
            div: div,
            progress: div.querySelector('progress'),
            label: div.querySelector('label')
        };
        progressHelper[file.uuid].progress.max = file.maxChunks;
    },
    onEnd: function (file) {
        console.log('onEnd');
        progressHelper[file.uuid].div.innerHTML = '<a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + '</a>';
    },
    onProgress: function (chunk) {
        console.log('progress');
        var helper = progressHelper[chunk.uuid];
        helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
        updateLabel(helper.progress, helper.label);
    }
};

function updateLabel(progress, label) {
    if (progress.position == -1) return;
    var position = +progress.position.toFixed(2).split('.')[1] || 100;
    label.innerHTML = position + '%';
}

//------------------------------------------------------------------------------------------------
function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    fftory.Send({
    bucket: f,
    channel: dataChannel,
    interval: 0,
    chunkSize: 16000, // 1000 for RTP; or 16k for SCTP
                     // chrome's sending limit is 64k; firefox' receiving limit is 16k!
    
    onBegin: fileHelper.onBegin,
    onEnd: fileHelper.onEnd,
    onProgress: fileHelper.onProgress
    });
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  }

  // function handleDragOver(evt) {
  //   evt.stopPropagation();
  //   // if (isChrome) evt.preventDefault();
  //   // if(isFirefox) evt.defaultPrevented();
  //   evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  // }

  // Setup the dnd listeners.
  var dropZone = document.getElementById('drop_zone');
    //------------------------------------------------------------------------------------------------

    var sendData = 'nothing';

    //var recipientId = prompt("Enter recipientID");

    var peer = null;
    var dcon = null;

    // the local video stream captured with getUserMedia()
    var localStream = null;
    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

   

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

    //------------------------------------------------------------
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~WEBRTC CORE SWAG~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var room = userinp;
    var isChannelReady;
    var isInitiator = false;
    var isStarted = false;
    var pc;
    var dataChannel;
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
            'OfferToReceiveAudio': false,
            'OfferToReceiveVideo': false
        }
    };

    /////////////////////////////////////////////

    //var room = location.pathname.substring(1);
    //var room = 'foo';

    var socket = io.connect('https://signalling.i2u2robot.in:7080');

    console.log('Creating or joining room ', room);
    socket.emit('create or join', room);

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
        if (message=='ready')
          maybeStart();
         else if (message.type === 'offer') {
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


    function start() {
        sendMessage('ready');
        if (isInitiator) {
            maybeStart();
        }
    }
       start();

    if (location.hostname != "localhost") {
        requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
    }

    function maybeStart() {
        console.log('In maybestart() isStarted :' + isStarted + 'isChannelReady' + isChannelReady);
        if (!isStarted && isChannelReady) {
            createPeerConnection();
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
//-----------------------------------Recieve file------------------------------------------------
    var rx = fftory.Receiver(fileHelper);
    function handleMessage(event) { 
        var data = JSON.parse(event.data);
    if(typeof data  =='object')
    {
    console.log('Received Object : ',data);
    rx.receive(JSON.parse(event.data));
    // fileR.receive(JSON.parse(event.data));
    }
    }

  function saveToDisk(fileUrl, fileName){
    console.log("saving file....");
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
        dataChannel.send('Hello world!');
        trace('Send channel state is: ' + readyState);
    }

    function handleReceiveChannelStateChange() {
        var readyState = dataChannel.readyState;
         dataChannel.send('Hello back!');
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

    // function send(sendData) {
    //     if (dataChannel.readyState == 'open'){
    //         if(typeof sendData =='object'){
    //             dataChannel.send(JSON.stringify(sendData));
    //      }
    //         else                                
    //         dataChannel.send(sendData);
    //     }
    // }

    //------------------------------------------------------------------------------------------------------------------------------------------------------------------
    $(document).ready(function() {
        $('#drop_zone').bind('dragover', function(event){
        event.preventDefault();
        event.stopPropagation();
    });
    dropZone.addEventListener('drop', handleFileSelect, false);
   });


});
