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
    	owner_zip: '',
    	owner1: '',
    	owner2: '',
    	owner3: '',
    	owner4: ''
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
	this.setData(rawPropObj);
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