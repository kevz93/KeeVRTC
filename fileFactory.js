// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/WebRTC-Experiment/tree/master/WebRTC-bucket-Sharing

// _______
// bucket.js

var fftory = {
    Send: function(config) {
        var bucket = config.bucket;
        var socket = config.channel;

        var chunkSize = config.chunkSize || 40 * 1000; // 64k max sctp limit (AFAIK!)
        var sliceId = 0;
        var cacheSize = chunkSize;

        var chunksPerSlice = Math.floor(Math.min(100000000, cacheSize) / chunkSize);
        var sliceSize = chunksPerSlice * chunkSize;
        var maxChunks = Math.ceil(bucket.size / chunkSize);

        // uuid is used to uniquely identify sending instance
        var uuid = (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace( /\./g , '-');

        socket.send(JSON.stringify({
            uuid: uuid,
            maxChunks: maxChunks,
            size: bucket.size,
            name: bucket.name,
            lastModifiedDate: bucket.lastModifiedDate,
            type: bucket.type,
            start: true
        }));

        bucket.maxChunks = maxChunks;
        bucket.uuid = uuid;
        if (config.onBegin) config.onBegin(bucket);

        var blob, reader = new FileReader();
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) {
                addChunks(bucket.name, evt.target.result, function() {
                    sliceId++;
                    if ((sliceId + 1) * sliceSize < bucket.size) {
                        blob = bucket.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize);
                        reader.readAsArrayBuffer(blob);
                    } else if (sliceId * sliceSize < bucket.size) {
                        blob = bucket.slice(sliceId * sliceSize, bucket.size);
                        reader.readAsArrayBuffer(blob);
                    } else {
                        socket.send(JSON.stringify({
                            uuid: uuid,
                            maxChunks: maxChunks,
                            size: bucket.size,
                            name: bucket.name,
                            lastModifiedDate: bucket.lastModifiedDate,
                            type: bucket.type,
                            end: true
                        }));

                        bucket.url = URL.createObjectURL(bucket);
                        if (config.onEnd) config.onEnd(bucket);
                    }
                });
            }
        };

        blob = bucket.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize);
        reader.readAsArrayBuffer(blob);

        var numOfChunksInSlice;
        var currentPosition = 0;
        var hasEntirebucket;
        var chunks = [];

        function addChunks(bucketName, binarySlice, callback) {
            numOfChunksInSlice = Math.ceil(binarySlice.byteLength / chunkSize);
            for (var i = 0; i < numOfChunksInSlice; i++) {
                var start = i * chunkSize;
                chunks[currentPosition] = binarySlice.slice(start, Math.min(start + chunkSize, binarySlice.byteLength));

                bucketConverter.ArrayBufferToDataURL(chunks[currentPosition], function(str) {
                    socket.send(JSON.stringify({
                        uuid: uuid,
                        value: str,
                        currentPosition: currentPosition,
                        maxChunks: maxChunks
                    }));
                });

                currentPosition++;
            }

            if (config.onProgress) {
                config.onProgress({
                    currentPosition: currentPosition,
                    maxChunks: maxChunks,
                    uuid: uuid
                });
            }

            if (currentPosition == maxChunks) {
                hasEntirebucket = true;
            }

            if (config.interval == 0 || typeof config.interval == 'undefined')
                callback();
            else
                setTimeout(callback, config.interval);
        }
    },

    Receiver: function(config) {
        var packets = { };

        function receive(chunk) {
            if (chunk.start && !packets[chunk.uuid]) {
                packets[chunk.uuid] = [];
                if (config.onBegin) config.onBegin(chunk);
            }

            if (!chunk.end && chunk.value) packets[chunk.uuid].push(chunk.value);

            if (chunk.end) {
                var _packets = packets[chunk.uuid];
                var finalArray = [], length = _packets.length;

                for (var i = 0; i < length; i++) {
                    if (!!_packets[i]) {
                        bucketConverter.DataURLToBlob(_packets[i], function(buffer) {
                            finalArray.push(buffer);
                        });
                    }
                }

                var blob = new Blob(finalArray, { type: chunk.type });
                blob = merge(blob, chunk);
                blob.url = URL.createObjectURL(blob);
                blob.uuid = chunk.uuid;

                if (!blob.size) console.error('Something went wrong. Blob Size is 0.');

                if (config.onEnd) config.onEnd(blob);
            }

            if (chunk.value && config.onProgress) config.onProgress(chunk);
        }

        return {
            receive: receive
        };
    },
    SaveToDisk: function(bucketUrl, bucketName) {
        var hyperlink = document.createElement('a');
        hyperlink.href = bucketUrl;
        hyperlink.target = '_blank';
        hyperlink.download = bucketName || bucketUrl;

        var mouseEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });

        hyperlink.dispatchEvent(mouseEvent);
        (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
    }
};

// ________________
// bucketConverter.js
var bucketConverter = {
    ArrayBufferToDataURL: function(buffer, callback) {
        window.BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;

        // getting blob from array-buffer
        var blob = new Blob([buffer]);

        // reading bucket as binary-string
        var bucketReader = new FileReader();
        bucketReader.onload = function(e) {
            console.log('str value: ',e.target.result);
            callback(e.target.result);
        };
        bucketReader.readAsDataURL(blob);
    },
    DataURLToBlob: function(dataURL, callback) {
        var binary = atob(dataURL.substr(dataURL.indexOf(',') + 1)),
            i = binary.length,
            view = new Uint8Array(i);

        while (i--) {
            view[i] = binary.charCodeAt(i);
        }

        callback(new Blob([view]));
    }
};

function merge(mergein, mergeto) {
    if (!mergein) mergein = { };
    if (!mergeto) return mergein;

    for (var item in mergeto) {
        mergein[item] = mergeto[item];
    }
    return mergein;
}