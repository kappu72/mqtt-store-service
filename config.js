
var config = {};

config.debug = process.env.DEBUG || false;



config.mqtt = {
    hostname: process.env.MQTT_HOSTNAME  || '167.114.230.71',
    port:     process.env.MQTT_PORT      || 1883,
}
config.mongodb = {
    hostname: process.env.MONGODB_HOSTNAME   || '167.114.230.71',
    port:     process.env.MONGODB_PORT       || 27017,
    database: process.env.MONGODB_DATABASE   || 'blowing'
}

config.stations = [
    { 
        id: 19070267,
        topic: 'device/ALP001/19070267/metrics/inst',
        topic_lasthour: 'device/ALP001/19070267/metrics/lasthourmax',
        collection: 'st_19070267',
        type: 'vento'
    },
    { 
        id: 19090456,
        topic: 'device/ALP001/19090456/metrics/inst',
        topic_lasthour: 'device/ALP001/19090456/metrics/lasthourmax',
        collection: 'st_19090456',
        type: 'vento'
    },
    { 
        id: 19090252,
        topic: 'device/ELP001/19090252/metrics/inst',
        topic_rainSum: 'device/ELP001/19090252/metrics/rainagg',
        collection: 'st_19090252',
        type: 'pioggia'
    },
    { 
        id: 20030132,
        topic: 'device/ELP001/20030132/metrics/inst',
        topic_rainSum: 'device/ELP001/20030132/metrics/rainagg',
        collection: 'st_20030132',
        type: 'pioggia'
    },
    { 
        id: 19100250,
        topic: 'device/ALP001/19100250/metrics/inst',
        topic_lasthour: 'device/ALP001/19100250/metrics/lasthourmax',
        collection: 'st_19100250',
        type: 'vento'
    },{ 
        id: 'baveno',
        topic: 'device/TRF001/baveno/metrics/inst',
        topic_lasthour: 'device/ALP001/19090456/metrics/lasthourmax',
        collection: 'st_baveno',
        type: 'idrometro'
    },{ 
        id: 'sml',
        topic: 'device/TRF001/sml/metrics/inst',
        topic_lasthour: 'device/TRF001/baveno/metrics/lasthourmax',
        collection: 'st_sml',
        type: 'idrometro'
        
    },


];

config.timers = {rain: 15000, stats: 30000};

config.mqtt.namespacepatch = process.env.MQTT_NAMESPACE_PATCH || 'device/ALP001//metrics/inst';
config.mqtt.namespacepathced = process.env.MQTT_NAMESPACE_PATCHED || 'device/ELP001/19070267/metrics/inst';

config.mqtt.patch = process.env.MQTT_PATCH || false;


config.mongodb = {};
config.mongodb.hostname   = process.env.MONGODB_HOSTNAME   || '167.114.230.71';
config.mongodb.port       = process.env.MONGODB_PORT       || 27017;
config.mongodb.database   = process.env.MONGODB_DATABASE   || 'blowing';


module.exports = config;
