const MongoClient  = require('mongodb').MongoClient;
const config   = require('./config');
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port;
const {merge, concat, timer, Observable} = require('rxjs');
const { map, bufferCount, tap, pipe} = require('rxjs/operators');
const date = require('date-and-time');

// ATTENZIONE ALLA TZ problema con il fatto che la stazione è in ora solare !! da sistemare
// i logger dovrebbero mandare i dati in UTC con la timezone settata invece qui è sempre un macello
function getFiveDaysSum (coll, updated, dataIdx) {
    const time = date.format(date.addDays(updated, -5), "YYYY-MM-DDTHH:mm:ssZ", true);
    const time1 = date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "d5"})))
}
function getDailySum (coll, updated, dataIdx) { // riporta il dato dell'ultimo giorno
    const time = date.format(updated, "YYYY-MM-DDT[00:00]", true);
    const time1 = date.format(updated, "YYYY-MM-DDT[23:59]", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "h24"})))
}
function getLast60Sum (coll, updated, dataIdx) {
    const time = date.format(date.addHours(updated, -1), "YYYY-MM-DDTHH:mm:ssZ", true);
    const time1 =  date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "h1"})))
}
function getLast30Sum (coll, updated, dataIdx) {
    const time = date.format(date.addMinutes(updated, -30), "YYYY-MM-DDTHH:mm:ssZ", true);
    const time1 =  date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "m30"})))
}
function getLast10Sum (coll, updated, dataIdx) {
    const time = date.format(date.addMinutes(updated, -10), "YYYY-MM-DDTHH:mm:ssZ", true);
    const time1 =  date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "m10"})))
}
function getLast5Sum (coll, updated, dataIdx) {
    const time = date.format(date.addMinutes(updated, -5), "YYYY-MM-DDTHH:mm:ssZ", true);
    const time1 =  date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "m5"})))
}
function getLast1Sum (coll, updated, dataIdx) {
    const time = date.format(date.addMinutes(updated, -1), "YYYY-MM-DDTHH:mm:ssZ", true);
    const time1 =  date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return getSum(coll, time, time1, dataIdx).pipe(map(res => ({res, type: "m1"})))
}
/**
 * 
 * @param {*} coll the collection to be queried
 * @param {*} startDate >= date requested
 * @param {*} endDate < date requested
 */
function getSum(coll, startDate, endDate, dataIdx) {
    return new Observable((observer) => {
        const cur = coll.aggregate([
            {$match: {$and: [{time:{ $gte:  startDate}}, {time:{ $lte:  endDate}}]}},
            {$group: {_id: null, sum: {$sum: {$arrayElemAt: [ "$inst", dataIdx ]}}, count: {$sum: 1}}},
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



module.exports = function getRainSum(coll, dataIdx = 4) {
    const updated = new Date();
    const time = date.format(updated, "YYYY-MM-DDTHH:mm:ssZ", true);
    return concat( getFiveDaysSum(coll, updated, dataIdx), getDailySum(coll, updated, dataIdx), getLast60Sum(coll, updated, dataIdx), getLast30Sum(coll, updated, dataIdx), getLast10Sum(coll, updated, dataIdx), getLast5Sum(coll, updated, dataIdx), getLast1Sum(coll, updated, dataIdx)).pipe(bufferCount(7), map(stats => ({stats, time})))

}