/**
 * Given a mongodb collection return an Observable that calcs hourly wind stats
 */

const date = require('date-and-time');
const {Observable} = require('rxjs');


module.exports = (coll, collection) => {
    const time_1 = date.format(date.addHours(new Date, 1), "YYYY-MM-DDTHH:00:00Z", true);
    const time =  date.format(new Date, "YYYY-MM-DDTHH:00:00Z", true);
        console.log(time, coll === null, collection);
        const aggI = coll.aggregate([ 
                    {$match: {$and: [{time:{ $gte:  time}}, {time:{ $lt:  time_1}}]}},
                    {$project : { 
                        time:1, _id: time, 
                        speed: {$arrayElemAt: [ "$inst", 4 ]},
                        dir: {$arrayElemAt: [ "$inst", 5 ]}},
                    },
                    {$sort: {speed: -1}},
                    {$limit: 1},
                    {$merge: { into: collection + "_hourly", on: "_id", whenMatched: "replace", whenNotMatched: "insert" }}
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