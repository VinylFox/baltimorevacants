var Owner = require('../app/Owner.js');
var sample = require('../spec/sample-data.js');

beforeEach(() => {
	owner = new Owner();
});

describe('basic owner setup', () => {

	it('should have an data object', () => {

		expect(owner.getData() instanceof Object).toBeTruthy();

	});

});

describe('ability to set the raw data and create appropriate fields', () => {

	it('should be able to set and retrieve the basic raw data', () => {

		owner.createFromRaw(sample.rawProperty[0]);
		var data = owner.getData();
		expect(data.primary_owner_name).toEqual(sample.property[0].primary_owner_name);
		expect(data.secondary_owner_name).toEqual(sample.property[0].secondary_owner_name);
		expect(data.tertiary_owner_name).toEqual(sample.property[0].tertiary_owner_name);
		expect(data.owner_type).toEqual(sample.property[0].owner_type);
		expect(data.owner_occupied).toEqual(sample.property[0].owner_occupied);

	});

});

describe('the property owner is identified appropriately', () => {

	it('as not being owner occupied', () => {
		owner.createFromRaw(sample.rawProperty[0]);
		expect(owner.isOwnerOccupied()).toEqual(sample.property[0].owner_occupied);
	});

	it('as being owner occupied', () => {
		owner.createFromRaw(sample.rawProperty[5]);
		expect(owner.isOwnerOccupied()).toEqual(sample.property[5].owner_occupied);
		expect(owner.getPropertyOwnerType()).toEqual(sample.property[5].owner_type);
	});

});

describe('the property owner is identified appropriately', () => {

	it('as a business', () => {
		owner.createFromRaw(sample.rawProperty[0]);
		expect(owner.getPropertyOwnerType()).toEqual(sample.property[0].owner_type);
	});

	it('as private', () => {
		owner.createFromRaw(sample.rawProperty[5]);
		expect(owner.getPropertyOwnerType()).toEqual(sample.property[5].owner_type);
	});

});