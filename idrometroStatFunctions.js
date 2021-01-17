
const config = require('./config');
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port;
const { Observable } = require('rxjs');
const date = require('date-and-time');

/**
 * 
 * @param {*} coll the collection to be queried
 * @param {*} startDate >= date requested
 * @param {*} endDate < date requested
 */

const getMaxMin = (coll, startDate, endDate) => {
    return new Observable((observer) => {
        const cur = coll.find({ $and: [{ time: { $gte: startDate } }, { time: { $lte: endDate } }] }).sort({ 'inst.2': -1 })
        if (cur == null) {
            observer.error('null agg iterator')
        } else {
            cur.toArray(function (err, results) {
                if (err) {
                    observer.error(err)
                } else {
                    const max = results[0];
                    const min = results.pop();
                    observer.next({ max, min });
                    observer.complete();
                }
            });
        }
    });
}

const aggregateHourly = (coll, collection) => {
    const time = date.format(new Date(), "YYYY-MM-DDTHH:00:00Z", true);
    const time_1 = date.format(date.addHours(new Date(), 1), "YYYY-MM-DDTHH:00:00Z", true);
    //console.log("Agregation times", time, time_1)
    const aggI = coll.aggregate([
        { $match: { time: { $gte: time, $lt: time_1 } } },
        {
            $project: {
                _id: 0, time: 1, qslm: { $arrayElemAt: ["$inst", 2] },
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%dT%H:00:00Z",
                        date: {
                            $dateFromString: { dateString: "$time" }
                        }
                    }
                },
                count: { $sum: 1 },
                max: { $max: "$qslm" },
                min: { $min: "$qslm" },
                avg: { $avg: "$qslm" }
            }
        },
        { $sort: { _id: 1 } },
        { $merge: { into: collection + "_hourly", on: "_id", whenMatched: "replace", whenNotMatched: "insert" } }
    ])
    return new Observable((observer) => {
        if (aggI == null) {
            observer.error('null agg iterator')
        } else {
            aggI.toArray(function (err, results) {
                if (err) {
                    observer.error(err)
                } else {
                    //console.log(results)
                    observer.next(results);
                    observer.complete();
                }
            });
        }

    });
}
module.exports = {
    aggregateHourly,
    getMaxMin
}