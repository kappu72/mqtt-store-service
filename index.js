/**
 *
 * Store and statistical service for blowing app.
 * Listen to mqtt broker and
 *
 * @author  Andrea Cappugi <github@link0.net>
 * @license MIT
 *
 */
const MongoClient  = require('mongodb').MongoClient;
const mqtt = require('mqtt');
const date = require('date-and-time');
const {merge, timer, Observable} = require('rxjs');
const { take,filter ,map, scan, switchMap, tap} = require('rxjs/operators');

const config   = require('./config');
const hourlyObs = require('./hourly');
const lastHourObs = require('./lasthour');

const mqttClient   = mqtt.connect({host: config.mqtt.hostname, port: config.mqtt.port});
const mqttClientPatch   = mqtt.connect({host: config.mqtt.hostname, port: config.mqtt.port});

// Ogni 10 minuti
const  calcStatTimer = timer(10000, 300000); 
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port ;

if(config.mqtt.patch) {
    mqttClientPatch.on('connect', function() {
    mqttClientPatch.subscribe(config.mqtt.namespacepatch, function (err) {
        if (!err) {
            console.log("Subscribed to patch ");
          }else {
            console.log("Unable to subscribe  wind isn't blowing", err);
          }
    });
    mqttClientPatch.on('message', function (topic, message) {
        mqttClientPatch.publish(config.mqtt.namespace, message);
    })

    
});}

mqttClient.on('connect', function () {
        console.log("Connected to mqtt broker");
        mqttClient.subscribe(config.mqtt.namespace, function (err) {
            if (!err) {
                console.log("Subscribed to weather station, wind is blowing");
              }else {
                console.log("Unable to subscribe  wind isn't blowing", err);
              }
        });
});



MongoClient.connect(mongoUri, {useUnifiedTopology: true }, function(error, client) {
    if(error != null) {
        throw error;
    }
    console.log("Connected to mongo blowing db");
    const coll = client.db(config.mongodb.database).collection(config.mongodb.collection);
    
    // Store data on mongodb
    mqttClient.on('message', function (topic, message) {
        const messageObject = JSON.parse(message);
        // si potrebbero già elaborare i dati ad esempio aggiungere la tz!
        coll.insertOne(messageObject, function(error, result) {
            if(error != null) {
                console.log("ERROR: " + error);
            }
        });
    });
    // Crea uno strem temporizzato aggiunge le statistiche per le ultime due ore
    calcStatTimer.pipe(switchMap(() =>  merge(
        hourlyObs(coll),
        lastHourObs(coll)
            .pipe(
                tap((lastHourWind) => mqttClient.publish(config.mqtt.namespacelasthour, JSON.stringify(lastHourWind), console.log))
            )
        )
    ),
    tap(data => console.log( data)
            )).subscribe(() =>{} );
    
});

