/**
 *
 * Store service for realtime weather station apps.
 * Listen to mqtt broker and connect sore the configured station in mongo db
 *
 * @author  Andrea Cappugi <github@link0.net>
 * @license MIT
 *
 */
const MongoClient  = require('mongodb').MongoClient;
const mqtt = require('mqtt');
const date = require('date-and-time');

const config   = require('./config');
const mqttClient   = mqtt.connect({host: config.mqtt.hostname, port: config.mqtt.port});

const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port ;

const topics = config.stations.map(({topic}) => topic)
const configByTopic = config.stations.reduce( (acc, st) => ({ ...acc, [st.topic]: st}), {});
console.log(topics, configByTopic)

mqttClient.on('connect', function () {
    console.log("Connected to mqtt broker");
    mqttClient.subscribe(topics, {qos: 2}, function (err) {
        if (!err) {
            console.log("Subscribed topics", topics);
            MongoClient.connect(mongoUri, {useUnifiedTopology: true }, function(error, client) {
                if(error != null) throw error;
                console.log("Connected to mongo blowing db");
                mqttClient.on('message', function (income_topic, message, packet) {
                    try {   
                        const { collection } = ( configByTopic[income_topic] || { } );
                        if(!collection) return;
                        const coll = client.db(config.mongodb.database).collection(collection);
                        const {time, inst} = JSON.parse(message);
                        if (!time || !inst) return;
                        const cleanTime = time.substr(0, 19) + "Z"; // viene eliminata qualsiasi tipo di informazione di TZ e riportata ad UTC, tutti i dati meteo devono essere in UTC
                        const row = {time: cleanTime, inst};
                        coll.insertOne(row, function(error, result) {
                            if(error != null) {
                                console.log("ERROR: " + error);
                            } else if(result){
                        //        console.log("inseriti " + collection, cleanTime, packet.qos)
                            }
                        });
                    }catch(e) {
                        console.log("errore" + income_topic, e)
                    }
                })
            })
        }else {
            console.log("Unable to subscribe  wind isn't blowing", err);
        }
    });
});
// Nota bene le Statistiche sono state seprate in statistics


