var Owner = require('../app/Owner.js');

var Property = function(config) {
    this.init(config);
};

Property.prototype.init = function(config) {
    for (var prop in config) this[prop] = config[prop];
    this.data = this.data || {
        properties: {}
    };
    this.owner = new Owner();
};

Property.prototype.getData = function() {
    return this.data;
};

Property.prototype.setData = function(data) {
    for (var prop in data) this.data[prop] = data[prop];
};

Property.prototype.createFromRaw = function(rawPropObj) {
    this.owner.createFromRaw(rawPropObj);
    var ownerData = this.owner.getData();
    var newPropObj = {};
    newPropObj.properties = {};
    newPropObj._id = rawPropObj.block + rawPropObj.lot;
    newPropObj.properties.block = rawPropObj.block;
    newPropObj.properties.lot = rawPropObj.lot;
    newPropObj.properties.owner1 = rawPropObj.owner1;
    newPropObj.properties.owner2 = rawPropObj.owner2;
    newPropObj.properties.owner3 = rawPropObj.owner3;
    newPropObj.properties.owner4 = rawPropObj.owner4;
    newPropObj.properties.property_address = rawPropObj.address;
    newPropObj.properties.owner_name1 = ownerData.owner_name1;
    newPropObj.properties.owner_name2 = ownerData.owner_name2;
    newPropObj.properties.owner_name3 = ownerData.owner_name3;
    newPropObj.properties.owner_type = ownerData.owner_type;
    newPropObj.properties.owner_occupied = ownerData.owner_occupied;
    newPropObj.properties.owner_address = ownerData.address;
    newPropObj.properties.owner_city = ownerData.city;
    newPropObj.properties.owner_state = ownerData.state;
    newPropObj.properties.owner_zip = ownerData.zip;
    this.setData(newPropObj);
};

Property.prototype.save = function() {
    if (this.data.block && this.data.lot) {
        this.data._id = this.data.block + this.data.lot;
        // do saving
    } else {
        console.log('Error saving property, needs a block and lot defined : ' + this.data);
    }
}

module.exports = Property;