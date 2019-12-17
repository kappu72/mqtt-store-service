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
const {bindNodeCallback, from,timer,combineLatest, Observable} = require('rxjs');
const { take,filter ,map, scan, switchMap, tap} = require('rxjs/operators');

const config   = require('./config');

const mqttUri  = 'mqtt://' + config.mqtt.hostname;

console.log(mqttUri, config.mqtt.port);

const client   = mqtt.connect(mqttUri, {port: config.mqtt.port});

// Ogni 10 minuti
const  calcStatTimer = timer(1, 600000); 
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port ;



client.on('connect', function () {
        console.log("Connected to mqtt broker");
        client.subscribe(config.mqtt.namespace, function (error) {
            if(!error) {
                console.log("Blowing!!");
            }
        });
});



MongoClient.connect(mongoUri, {useUnifiedTopology: true }, function(error, client) {
    if(error != null) {
        throw error;
    }

    var coll = client.db(config.mongodb.database).collection(config.mongodb.collection);
    
    // Store data on mongodb
    client.on('message', function (topic, message) {
        console.log(message);
        const messageObject = JSON.parse(message);
       
        // si potrebbero già elaborare i dati ad esempio aggiungere la tz!
        coll.insert(messageObject, function(error, result) {
            console.log(result);
            if(error != null) {
                console.log("ERROR: " + error);
            }
        });
    });
    // Crea uno strem temporizzato aggiunge le statistiche per le ultime due ore
    calcStatTimer.pipe(switchMap(() => {
        const time = date.format(date.addHours(new Date, -1), "YYYY-MM-DDTHH:00:00", true);
        console.log(time);
        const aggI = coll.aggregate([ 
                    {$match: {time:{ $gte:  time}}},
                    {$group: { _id: {$dateToString: { format: "%Y-%m-%dT%H:00:00%z", date: {$dateFromString: {dateString:"$time"}} }}, 
                               speed: {$avg: {$arrayElemAt: [ "$inst", 4 ]}},
                               dir: {$avg: {$arrayElemAt:["$inst",5]}},
                               count: {$sum: 1} 
                             }},
                    {$sort: {_id: -1 }},
                    {$merge: { into: config.mongodb.collection + "_hourly", on: "_id", whenMatched: "replace", whenNotMatched: "insert" }}
                ])
        
        return new Observable((observer) => {
            if (aggI == null) {
                observer.error('null agg iterator')
            } else {
                aggI.toArray(function(err, results) {
                    if (err) {
                        observer.error(err)
                    } else {
                        observer.next(results);
                        observer.complete();
                    }
                });
            }

        });
    }),
    tap(data => console.log( data)
            )).subscribe(() =>{} );
    
});

