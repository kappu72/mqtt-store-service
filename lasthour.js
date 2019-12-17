/**
 * Given a mongodb collection return an Observable that calcs hourly wind stats
 */

const date = require('date-and-time');
const {Observable} = require('rxjs');
const config = require('./config');

module.exports = (coll) => {
    const time = date.format(date.addHours(new Date(), -1), "YYYY-MM-DDTHH:mm:ss", true);
    const updated = date.format(new Date(), "YYYY-MM-DDTHH:mm:ss", true);
        console.log(time, updated);
        const aggI = coll.aggregate([
            {$match: {time: {$gte: time}}},
            {$project : { 
                time:1, _id: 0, 
                speed: {$arrayElemAt: [ "$inst", 4 ]},
                dir: {$arrayElemAt: [ "$inst", 5 ]}},
            },
            {$sort: {speed: -1}},
            {$limit: 1}]);
        return new Observable((observer) => {
            if (aggI == null) {
                observer.error('null agg iterator')
            } else {
                aggI.toArray(function(err, results) {
                    if (err) {
                        observer.error(err)
                    } else {
                        observer.next({...results.pop(), updated});
                        observer.complete();
                    }
                });
            }

        });
}