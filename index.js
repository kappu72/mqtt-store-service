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

// Ogni 50 minuti
const  calcStatTimer = timer(10000, 30000); 
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
        mqttClientPatch.publish(config.mqtt.namespacepathced, message);
    })

    
});}

mqttClient.on('connect', function () {
        console.log("Connected to mqtt broker");
        mqttClient.subscribe("#", function (err) {
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
    
    config.stations.map(({collection, id, topic, topic_lasthour}) => {
        const coll = client.db(config.mongodb.database).collection(collection);
        mqttClient.on('message', function (income_topic, message) {
            // console.log(income_topic)
            if(topic === income_topic) {
                const {time, inst} = JSON.parse(message);
                const row = {time, inst};
                // console.log("Station: " + id + " ", topic, row );
                // si potrebbero già elaborare i dati ad esempio aggiungere la tz!
                coll.insertOne(row, function(error, result) {
                     if(error != null) {
                         console.log("ERROR: " + error);
                     } else if(result){
                        console.log("inseriti", collection, result.result)
                    }
                 });
            }
        })
        // Crea uno strem temporizzato aggiunge le statistiche per le ultime due ore
        if(topic_lasthour)
        {
            calcStatTimer
            .pipe(
                switchMap(() =>  merge(
                    hourlyObs(coll, collection),
                    lastHourObs(coll)
                         .pipe(
                            tap((lastHourWind) => mqttClient.publish(topic_lasthour, JSON.stringify(lastHourWind), console.log))
                    )
                    )
                ),
                // tap(data => console.log( "timer ", topic, data))
        ).subscribe(() =>{} )
    }
    })
    
});

