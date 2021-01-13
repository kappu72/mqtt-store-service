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
const {merge, timer, of} = require('rxjs');
const { switchMap, tap} = require('rxjs/operators');

const config   = require('./config');
const hourlyObs = require('./hourly');
const lastHourObs = require('./lasthour');
const aggregateRain = require('./aggregateHydroData');
const idrometroMaxMin = require('./idrometroMaxMin');


const mqttClient   = mqtt.connect({host: config.mqtt.hostname, port: config.mqtt.port});
const mqttClientPatch   = mqtt.connect({host: config.mqtt.hostname, port: config.mqtt.port});


const  calcStatTimer = timer(100, config.timers.stats); 
const rainTimer = timer(100, config.timers.rain);

const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port ;



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
    config.stations.map(({collection, id, topic, topic_lasthour, topic_rainSum, type}) => {
        console.log(id, collection, topic, type);
        const coll = client.db(config.mongodb.database).collection(collection);
        // Crea uno stream temporizzato aggiunge le statistiche per le ultime due ore 
        if(type === 'vento' && topic_lasthour)
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
                tap(data => console.log( "timer ", topic, data))
        ).subscribe(() =>{} )
        }
        else if(type === 'idrometro' && topic_lasthour)
        {
          calcStatTimer
          .pipe(
              switchMap(() => {
                  const now = new Date()
                  console.log(now);
                  const startDate = date.format(now, "YYYY-MM-DDT[00:00]", true);
                  const endDate = date.format(now, "YYYY-MM-DDT[23:59]", true);
                  console.log(startDate, endDate);
                    return idrometroMaxMin(coll, startDate, endDate)
                }
              )
              //ç,tap(data => console.log( "idrometro ", topic_lasthour, data))
              ,tap((data) => mqttClient.publish(topic_lasthour, JSON.stringify(data), console.log))
              
          ).subscribe(() =>{} )
        }
        else if(type === 'pioggia' && topic_rainSum){
            rainTimer
            .pipe(
                //tap(() => console.log("Timer emit")),
                switchMap(() =>  aggregateRain(coll).pipe(tap((rainAgg) => mqttClient.publish(topic_rainSum, JSON.stringify(rainAgg), console.log)))
                )
                ,tap(data => console.log( "rain ", topic_rainSum, data))
            ).subscribe(() =>{} )
        }
    })
    
});

