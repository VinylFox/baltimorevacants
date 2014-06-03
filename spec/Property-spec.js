var Property = require('../app/Property.js'),
	sample = require('../spec/sample-data.js');

beforeEach(function(){
	property = new Property();
});

describe('basic property setup', function() {

	it('should have an data object', function() {

		expect(property.getData() instanceof Object).toBeTruthy();

	});

});

describe('ability to set the raw data and create appropriate fields', function(){

	it('and be able to set and retrieve the basic raw data', function(){

		property.createFromRaw(sample.rawProperty[0]);
		var data = property.getData();
		console.log(data);
		expect(data.block).toEqual(sample.property[0].block);
		expect(data.lot).toEqual(sample.property[0].lot);
		expect(data.property_address).toEqual(sample.property[0].property_address);
		expect(data.primary_owner_name).toEqual(sample.property[0].primary_owner_name);
		expect(data.secondary_owner_name).toEqual(sample.property[0].secondary_owner_name);
		expect(data.tertiary_owner_name).toEqual(sample.property[0].tertiary_owner_name);
		expect(data.owner_type).toEqual(sample.property[0].owner_type);
		expect(data.owner_occupied).toEqual(sample.property[0].owner_occupied);
		expect(data.owner_address).toEqual(sample.property[0].owner_address);
		expect(data.owner_city).toEqual(sample.property[0].owner_city);
		expect(data.owner_state).toEqual(sample.property[0].owner_state);
		expect(data.owner_zip).toEqual(sample.property[0].owner_zip);

	});

});