const execSync = require('child_process').execSync;
// MQTT Settings
var MQTT_BROKER = 'mesrv.malak-e.com';
var MQTT_PORT = 6010;
var KEEPALIVE = 10;
var MQTT_RECONNECT_PERIOD = 3000;
var PROTOCOL_ID = 'MQTT';
var PROTOCOL_VERSION = 4;
var CLEAN = false;
var CONNECT_TIMEOUT = 30 * 1000;
// BLE Scanning settings
var RSSI_THRESHOLD = -45;
var EXIT_GRACE_PERIOD = 4000; // milliseconds
// location settings
var LAT = "25.189721";
var LONG = "55.2602083";
var ZONE_ID = "279780779190996992";
const ENV = process.env.NODE_ENV || 'development';
const IS_DEV = ENV === 'development';
module.exports = {
    ENV: {
        loader: IS_DEV
    },
    MQTT: {
        BROKER: MQTT_BROKER,
        PORT: MQTT_PORT,
        RECONNECT_PERIOD: MQTT_RECONNECT_PERIOD,
        KEEP_A_LIVE: KEEPALIVE,
        PROTOCOL_ID: PROTOCOL_ID,
        PROTOCOL_VERSION: PROTOCOL_VERSION,
        CLEAN: CLEAN,
        CONNECT_TIMEOUT: CONNECT_TIMEOUT,
    },
    BLE: {
        RSSI_THRESHOLD: RSSI_THRESHOLD,
        EXIT_GRACE_PERIOD: EXIT_GRACE_PERIOD,
    },
    LOCATION: {
        LATITUDE: LAT,
        LONGITUDE: LONG,
        ZONE_ID: ZONE_ID
    },
    /**
     * @return {string}
     */
    DEVICE_ID: function() {
        var macSetup = execSync("cat /sys/class/net/wlan0/address", {
            encoding: 'utf8'
        });
        return macSetup.toString().replace(/:/g, '').toLowerCase();
    }
};
