var Owner = require('../app/Owner.js'),
	sample = require('../spec/sample-data.js');

beforeEach(function(){
	owner = new Owner();
});

describe('basic owner setup', function() {

	it('should have an data object', function() {

		expect(owner.getData() instanceof Object).toBeTruthy();

	});

});

describe('ability to set the raw data and create appropriate fields', function(){

	it('should be able to set and retrieve the basic raw data', function(){

		owner.createFromRaw(sample.rawProperty[0]);
		var data = owner.getData();
		expect(data.primary_owner_name).toEqual(sample.property[0].primary_owner_name);
		expect(data.secondary_owner_name).toEqual(sample.property[0].secondary_owner_name);
		expect(data.tertiary_owner_name).toEqual(sample.property[0].tertiary_owner_name);
		expect(data.owner_type).toEqual(sample.property[0].owner_type);
		expect(data.owner_occupied).toEqual(sample.property[0].owner_occupied);

	});

});

describe('the property owner is identified appropriately', function(){

	it('as not being owner occupied', function(){
		owner.createFromRaw(sample.rawProperty[0]);
		expect(owner.isOwnerOccupied()).toEqual(sample.property[0].owner_occupied);
	});

});

describe('the property owner is identified appropriately', function(){

	it('as a business', function(){
		owner.createFromRaw(sample.rawProperty[0]);
		expect(owner.getPropertyOwnerType()).toEqual(sample.property[0].owner_type);
	});

});