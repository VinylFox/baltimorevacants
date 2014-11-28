var MongoClient = require('mongodb').MongoClient;
var googleAddressUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json?sensor=false&input={0}&key=AIzaSyCpq4isEKP2F86bk578zz8MS3V9Fo69Afk&location=39.331267,-76.632679&radius=200&type=street_address&components=country:us";

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
  if (err1) throw err1;

  var cases_collection = db.collection('cases');
  var property_collection = db.collection('property');

  var cases = cases_collection.find({
    parties: {
      $elemMatch: {
        partyType: 'Property Address'
      }
    }
  }, {
    caseNo: 1,
    parties: 1
  }).toArray(function(err2, data) {

    var cases_len = data.length;
    for (var i = 0; i < cases_len; i++) {
      var parties = data[i].parties,
        parties_len = parties.length;
      for (var t = 0; t < parties_len; t++) {
        if (parties[t].partyType === 'Property Address') {
          var address = parties[t].name,
            address_parts = address.split(',');
          address = address_parts[0].replace(' Balto', '');
          address = address.toUpperCase();
          console.log(address);
          var processResult = function(err3, data1) {
            if (!err3 && data1[0]) {
              console.log('Found:', data1[0]);
            }
          };
          property_collection.find({
            'properties.property_address': address
          }, {
            'properties.block': 1,
            'properties.lot': 1,
            'properties.property_address': 1
          }).toArray(processResult);
        }
      }
    }

  });

});