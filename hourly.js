/**
 * Given a mongodb collection return an Observable that calcs hourly wind stats
 */

const date = require('date-and-time');
const {Observable} = require('rxjs');
const config = require('./config');

module.exports = (coll) => {
    const time = date.format(date.addHours(new Date, -1), "YYYY-MM-DDTHH:00:00Z", true);
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
}