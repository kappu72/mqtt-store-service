const config   = require('./config');
const mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port ;
const MongoClient  = require('mongodb').MongoClient;
const date = require('date-and-time');


MongoClient.connect(mongoUri, {useUnifiedTopology: true }, function(error, client) {
    if(error != null) {
        throw error;
    }
    console.log("Connected to mongo blowing db");
    const coll = client.db("blowing").collection("st_19070267");
    
    const cur = coll.aggregate([ 
           {$match: {$and: [{time:{ $gte:  "2020-03-01T00:00"}}, {time:{ $lt:  "2020-04-01T00:00"}}]}},
           {$group: { _id: {$dateToString: { format: "%Y-%m-%dT%H:00:00", date: {$dateFromString: {dateString:"$time"}} }},
                    count: {$sum: 1} 
                  }}, 
           {$sort: {_id: 1}}
    ])
    cur.toArray().then((result) => 
        Promise.all(result.map(({_id}) => {
            const hour = date.parse(_id, "YYYY-MM-DDTHH:mm:ss", true)
            const time =  date.format(hour, "YYYY-MM-DDTHH:00:00Z", true);
            const time_1 = date.format(date.addHours(hour, 1), "YYYY-MM-DDTHH:00:00Z", true);
            console.log(time, _id, time_1);
            return coll.aggregate([ 
                   {$match: {$and: [{time:{ $gte:  time}}, {time:{ $lt:  time_1}}]}},
                   {$project : { 
                     time:1, _id: time, 
                     speed: {$arrayElemAt: [ "$inst", 4 ]},
                     dir: {$arrayElemAt: [ "$inst", 5 ]}},
                 },
                 {$sort: {speed: -1}},
                 {$limit: 1},
                 {$merge: { into: "st_19070267_hourly", on: "_id", whenMatched: "replace", whenNotMatched: "insert" }}
            ])
        })

    )).then(values => { 
        values.forEach(e => e.toArray().then(r => console.log(r)))
        client.close();
    }
        )
});