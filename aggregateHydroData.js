const MongoClient  = require('mongodb').MongoClient;
const config   = require('./config');
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port;
const {merge, concat, timer, Observable} = require('rxjs');
const { map, bufferCount, tap, pipe} = require('rxjs/operators');
const date = require('date-and-time');

// ATTENZIONE ALLA TZ problema con il fatto che la stazione è in ora solare !! da sistemare
// i logger dovrebbero mandare i dati in UTC con la timezone settata invece qui è sempre un macello
function getDailySum (coll) {
    
    const time1 = date.format(date.addDays(new Date(), 1), "YYYY-MM-DD", true);
    const time = date.format(new Date(), "YYYY-MM-DD", true);
    return getSum(coll, time, time1).pipe(map(res => ({res, type: "h24", time: time})))
}
function getLast60Sum (coll) {
    const time = date.format(date.addHours(new Date(), -1), "YYYY-MM-DDTHH:mm:00Z", true);
    const time1 =  date.format(new Date, "YYYY-MM-DDTHH:mm:00Z", true);
    return getSum(coll, time, time1).pipe(map(res => ({res, type: "h1", time: time1})))
}
function getLast30Sum (coll) {
    const time = date.format(date.addMinutes(new Date(), -30), "YYYY-MM-DDTHH:mm:00Z", true);
    const time1 =  date.format(new Date, "YYYY-MM-DDTHH:mm:00Z", true);
    return getSum(coll, time, time1).pipe(map(res => ({res, type: "m30", time: time1})))
}
function getLast10Sum (coll) {
    const time = date.format(date.addMinutes(new Date(), -10), "YYYY-MM-DDTHH:mm:00Z", true);
    const time1 =  date.format(new Date, "YYYY-MM-DDTHH:mm:00Z", true);
    return getSum(coll, time, time1).pipe(map(res => ({res, type: "m10", time: time1})))
}
function getLast5Sum (coll) {
    const time = date.format(date.addMinutes(new Date(), -5), "YYYY-MM-DDTHH:mm:00Z", true);
    const time1 =  date.format(new Date, "YYYY-MM-DDTHH:mm:00Z", true);
    return getSum(coll, time, time1).pipe(map(res => ({res, type: "m5", time: time1})))
}
/**
 * 
 * @param {*} coll the collection to be queried
 * @param {*} startDate >= date requested
 * @param {*} endDate < date requested
 */
function getSum(coll, startDate, endDate, time) {
    return new Observable((observer) => {
        const cur = coll.aggregate([
            {$match: {$and: [{time:{ $gte:  startDate}}, {time:{ $lte:  endDate}}]}},
            {$group: {_id: null, sum: {$sum: {$arrayElemAt: [ "$inst", 4 ]}}, count: {$sum: 1}}},
            {$limit: 1}
        ])
        if (cur == null) {
            observer.error('null agg iterator')
        } else {
            cur.toArray(function(err, results) {
                if (err) {
                    observer.error(err)
                } else {
                    const [{sum, count} = {}] = results;
                    observer.next({sum, count});
                    observer.complete();
                }
            });
        }
    });
}



module.exports = function getRainSum(coll) {
    return concat( getDailySum(coll), getLast60Sum(coll), getLast30Sum(coll), getLast10Sum(coll), getLast5Sum(coll)).pipe(bufferCount(5))

}


// MongoClient.connect(mongoUri, {useUnifiedTopology: true }, function(error, client) {
//     if(error != null) {
//         throw error;
//     }
//     console.log("Connected to mongo blowing db");
//     const coll = client.db(config.mongodb.database).collection("st_19090252");
    
//     getRainSum(coll).subscribe((r) => console.log(r));
// });