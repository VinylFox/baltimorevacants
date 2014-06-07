var Owner = require('../app/Owner.js');

var Property = function(config){
	for (var prop in config) this[prop] = config[prop];
	this.data = this.data || {
    	block: '',
    	lot: '',
    	property_address: '',
    	owner_occupied: '',
    	primary_owner_name: '',
    	secondary_owner_name: '',
    	tertiary_owner_name: '',
    	owner_address: '',
    	owner_city: '',
    	owner_state: '',
    	owner_zip: ''
    };
    this.owner = new Owner();
};

Property.prototype.getData = function(){
	return this.data;
};

Property.prototype.setData = function(data){
	for (var prop in data) this.data[prop] = data[prop];
};

Property.prototype.createFromRaw = function(rawPropObj){
	this.owner.createFromRaw(rawPropObj);
    var ownerData = this.owner.getData();
    var newPropObj = {};
    newPropObj._id = rawPropObj.block+rawPropObj.lot;
    newPropObj.block = rawPropObj.block;
    newPropObj.lot = rawPropObj.lot;
    newPropObj.property_address = rawPropObj.address;
    newPropObj.primary_owner_name = ownerData.primary_owner_name;
    newPropObj.secondary_owner_name = ownerData.secondary_owner_name;
    newPropObj.tertiary_owner_name = ownerData.tertiary_owner_name;
    newPropObj.owner_type = ownerData.owner_type;
    newPropObj.owner_occupied = ownerData.owner_occupied;
    newPropObj.owner_address = ownerData.address;
    newPropObj.owner_city = ownerData.city;
    newPropObj.owner_state = ownerData.state;
    newPropObj.owner_zip = ownerData.zip;
	this.setData(newPropObj);
};

Property.prototype.save = function(){
	if (this.data.block && this.data.lot) {
		this.data._id = this.data.block+this.data.lot;
		// do saving
	} else {
		console.log('Error saving property, needs a block and lot defined : '+this.data);
	}
}

module.exports = Property;