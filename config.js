
var config = {};

config.debug = process.env.DEBUG || false;

config.mqtt  = {};
config.mqtt.namespace = process.env.MQTT_NAMESPACE || 'device/ELP001/19070267/metrics/inst';
config.mqtt.namespacelasthour = process.env.MQTT_NAMESPACE_LAST_HOUR || 'device/ELP001/19070267/metrics/lasthourmax';
config.mqtt.hostname  = process.env.MQTT_HOSTNAME  || 'localhost';
config.mqtt.port      = process.env.MQTT_PORT      || 1883;

config.mongodb = {};
config.mongodb.hostname   = process.env.MONGODB_HOSTNAME   || 'localhost';
config.mongodb.port       = process.env.MONGODB_PORT       || 27017;
config.mongodb.database   = process.env.MONGODB_DATABASE   || 'blowing';
config.mongodb.collection = process.env.MONGODB_COLLECTION || 'st_19070267';

module.exports = config;