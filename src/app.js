var five = require("johnny-five");
var Edison = require("edison-io");
var socket = require("./pubsub");
var config = require("./config");
var logger = require("./logger");
var noble = require('noble');
var utile = require('utile');
var mqtt = require('mqtt');
var board = new five.Board({
    io: new Edison()
});
var OrangeLEDState = true,
    BlueLEDState = true,
    BuzzerState = true,
    YellowLedStatus = true,
    RelayStatus = false,
    PlusStatus = true;
var OrangeLED = null,
    BlueLED = null,
    RedLED = null,
    Buzzer = null,
    Relay = null,
    client = null,
    _DEVICE_ID = null,
    inRange = [];
board.on("ready", function() {
    OrangeLED = new five.Led(13);
    BlueLED = new five.Led(12);
    RedLED = new five.Led(11);
    Buzzer = new five.Led(10);
    Relay = new five.Relay(9);
    // this.Relay.inject({
    //     relay: Relay
    // });
    BlueLED.on();
    this.on("exit", function() {
        BlueLED.off();
        BlueLED.stop();
        RedLED.off();
        RedLED.stop();
        OrangeLED.off();
        OrangeLED.stop();
        Relay.off();
    });
    _DEVICE_ID = config.DEVICE_ID();
    client = mqtt.connect({
        host: config.MQTT.BROKER,
        port: config.MQTT.PORT,
        keepalive: config.MQTT.KEEP_A_LIVE, //seconds, set to 0 to disable
        clientId: utile.format('edison_%s', _DEVICE_ID),
        rotocolId: config.MQTT.PROTOCOL_ID,
        protocolVersion: config.MQTT.PROTOCOL_VERSION,
        clean: config.MQTT.CLEAN, //set to false to receive QoS 1 and 2 messages while offline
        reconnectPeriod: config.MQTT.RECONNECT_PERIOD, // milliseconds, interval between two reconnections
        connectTimeout: config.MQTT.CONNECT_TIMEOUT //milliseconds, time to wait before a CONNACK is received
    });
    client.on('message', function(topic, message) {});
    client.on('connect', function() {
        client.subscribe('/presence/' + _DEVICE_ID);
        client.subscribe('/open/lock')
        client.publish('/presence', _DEVICE_ID);
        logger.info('Connection established %s', _DEVICE_ID);
        try {
            noble.startScanning([], true);
            logger.info("Scanning Started,,,,");
        } catch (e) {
            logger.error("Somthing went wrong , not able to start scanning. ERROR : ", e.message);
        }
    });
    client.on('offline', function() {
        logger.warn('Disconnected %s', _DEVICE_ID);
        noble.startScanning([], false);
    });
    client.on('reconnecting', function() {
        logger.warn('Reconnecting,,,, %s', _DEVICE_ID);
    });
});
// noble.on('stateChange', function(state) {
//     if (state === 'poweredOn') {
//         try {
//             noble.startScanning([], true);
//             logger.info("Scanning Started,,,,");
//         } catch (e) {
//             logger.error("Somthing went wrong , not able to start scanning. ERROR : ", e.message);
//         }
//     } else {
//         noble.stopScanning();
//     }
// });
noble.on('discover', function(peripheral) {
    if (peripheral.rssi < config.BLE.RSSI_THRESHOLD) {
        // ignore
        return;
    }
    var id = peripheral.id;
    var entered = !inRange[id];
    if (entered) {
        inRange[id] = {
            peripheral: peripheral
        };
        OrangeLED.strobe(100);
        setTimeout(function() {
            OrangeLED.off();
            OrangeLED.stop();
        }, 1500);
        var message = pertioalToString(peripheral, 'entered');
        var name = peripheral.advertisement.localName;
        client.publish('/scanner/tracker/' + name, message.toString(), {
            qos: 1
        }, function() {
            logger.info('published');
            inRange[id].published = Date.now();
        });
        logger.info('"' + name + '" entered (RSSI ' + peripheral.rssi + ') ' + new Date());
    }
    inRange[id].lastSeen = Date.now();
});
setInterval(function() {
    for (var id in inRange) {
        if (inRange[id].lastSeen < (Date.now() - config.BLE.EXIT_GRACE_PERIOD)) {
            var peripheral = inRange[id].peripheral;
            var name = peripheral.advertisement.localName;
           
            logger.warn('"' + id + '" exited (RSSI ' + peripheral.rssi + ') ' + new Date());
            var message = pertioalToString(peripheral, 'exited');
            client.publish('/scanner/tracker/' + name, message.toString(), {
                qos: 1
            }, function() {
                logger.info('published');
                logger.info('Message: \n' + message.toString());
            });
            RedLED.strobe(100);
            setTimeout(function() {
                RedLED.off();
                RedLED.stop();
            }, 1500);
            delete inRange[id];
        }
    }
}, config.BLE.EXIT_GRACE_PERIOD / 2);

function pertioalToString(peripheral, event) {
    var name = peripheral.advertisement.localName;
    return JSON.stringify({
        id: peripheral.id || null,
        type: 'discover',
        peripheralUuid: peripheral.uuid || null,
        address: peripheral.address || null,
        addressType: peripheral.addressType || null,
        connectable: peripheral.connectable || null,
        advertisement: {
            localName: name || null,
            // localName: peripheral.advertisement.localName || null,
            txPowerLevel: peripheral.advertisement.txPowerLevel || null,
            serviceUuids: peripheral.advertisement.serviceUuids || null,
            manufacturerData: (peripheral.advertisement.manufacturerData ? peripheral.advertisement.manufacturerData.toString('hex') : null),
            serviceData: (peripheral.advertisement.serviceData ? peripheral.advertisement.serviceData.toString('hex') : null)
        },
        rssi: peripheral.rssi || null,
        state: 'disconnected',
        timestamp: Date.now(),
        event: event,
        scanner_mac: _DEVICE_ID,
        lastPublished: Date.now(),
        lat: config.LOCATION.LATITUDE,
        long: config.LOCATION.LONGITUDE,
        zone: config.LOCATION.ZONE_ID,
        name: name
    });
}
