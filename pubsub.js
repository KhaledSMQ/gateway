var mqtt = require('mqtt');
var utile = require('utile');
var config = require('./config');
var logger = require("./logger");

var pubsub = function () {
};

var client = null;

pubsub.prototype.connect = function (id, callback) {
    client = mqtt.connect({
        host: config.MQTT.BROKER,
        port: config.MQTT.PORT,
        keepalive: config.MQTT.KEEP_A_LIVE, //seconds, set to 0 to disable
        clientId: utile.format('edison_%s', id),
        rotocolId: config.MQTT.PROTOCOL_ID,
        protocolVersion: config.MQTT.PROTOCOL_VERSION,
        clean: config.MQTT.CLEAN, //set to false to receive QoS 1 and 2 messages while offline
        reconnectPeriod: config.MQTT.RECONNECT_PERIOD, // milliseconds, interval between two reconnections
        connectTimeout: config.MQTT.CONNECT_TIMEOUT //milliseconds, time to wait before a CONNACK is received
    }, function () {
        return callback(client);
    });
};


module.exports = pubsub;
