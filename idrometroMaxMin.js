
const config   = require('./config');
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port;
const {Observable} = require('rxjs');


/**
 * 
 * @param {*} coll the collection to be queried
 * @param {*} startDate >= date requested
 * @param {*} endDate < date requested
 */

module.exports = function getMaxMin(coll, startDate, endDate) {
    return new Observable((observer) => {
        const cur = coll.find( {$and: [{time:{ $gte:  startDate}}, {time:{ $lte:  endDate}}]}).sort({ 'inst.2': -1 })
        if (cur == null) {
            observer.error('null agg iterator')
        } else {
            cur.toArray(function(err, results) {
                if (err) {
                    observer.error(err)
                } else {
                    const max = results[0];
                    const min= results.pop();
                    observer.next({max, min});
                    observer.complete();
                }
            });
        }
    });
}