var Address = require('../app/Address.js');

var Owner = function(config) {
	this.init(config);
	this.normalizations = this.normalizations || [
		['.', ''],
		[',', ''],
		['/', ''],
		[' NH RES', ''],
		[' III', ''],
		[' II', ''],
		[' DP', ''], // development partnership
		[' AND ', ' & '],
		['ASSOCIATES', ''],
		['INVESTMENTS', ''],
		['INCORPORATED', ''],
		[' INC', ''],
		[' LLC', ''],
		[' LLP', ''],
		[' LP', ''],
		[' PLC', ''],
		['CORPORATION', ''],
		[' CORP', ''],
		[' OF BALTIMORE', ''],
		[' OF', ''],
		[' LIMITED', ''],
		['MORTGAGE', ''],
		['THE ', ''],
		[' THE', ''],
		[' GROUP', ''],
		['BUSINESS', ''],
		[' TRUST', ''],
		['LIMITED', ''],
		['HOLDINGS', ''],
		['HOLDING', ''],
		['RENTALS', ''],
		['RENTAL', ''],
		['PROPERTIES', ''],
		[' TAX', ''],
		['COMPANY', ''],
		['PARTNERSHIP', ''],
		['PARTNERS', ''],
		['DEVELOPMENT', ''],
		['INVESTMENTS', ''],
		[' HOMES', ''],
		['RESIDENTIAL', '', ['PRESIDENTIAL']]
	];
};

Owner.prototype.init = function(config) {
	for (var prop in config) this[prop] = config[prop];
	this.data = this.data || {
		property_address: '',
		owner_occupied: '',
		owner_type: '',
		owner_name1: '',
		owner_name2: '',
		owner_name3: ''
	};
	this.owner_address = new Address();
};

Owner.prototype.getData = function() {
	return this.data;
};

Owner.prototype.setData = function(data) {
	for (var prop in data) this.data[prop] = data[prop];
};

Owner.prototype.isOwnerOccupied = function() {
	var data = this.getData();
	//console.log("OWNER OCCUPIED:", data);
	if (this.isCityOwned() || this.looksLikeBusiness(data.owner1) || this.looksLikeBusiness(data.owner2)) {
		return false;
	} else {
		return (
			data.property_address == data.owner2 ||
			data.property_address == data.owner3 ||
			data.property_address == data.owner4
		);
	}
};

Owner.prototype.looksLikeRental = function(str1, str2) {
	return (str1.indexOf('HOMES') != -1 || str1.indexOf('MANAGEMENT') != -1 || str1.indexOf('RENTAL') != -1 || str1.indexOf('PROPERTY') != -1 || str1.indexOf('PROPERTIES') != -1 || str2.indexOf('HOMES') != -1 || str2.indexOf('MANAGEMENT') != -1 || str2.indexOf('RENTAL') != -1 || str2.indexOf('PROPERTY') != -1 || str2.indexOf('PROPERTIES') != -1);
};

Owner.prototype.isCityOwned = function() {
	var data = this.getData();
	return (this.looksLikeCityOwned(data.owner1) || this.looksLikeCityOwned(data.owner2) || this.looksLikeCityOwned(data.owner3));
}

Owner.prototype.looksLikeCityOwned = function(str) {
	return (str.indexOf('MAYOR') != -1 || str.indexOf('HOUSING AUTHORITY') != -1);
}

Owner.prototype.looksLikeFederal = function(str) {
	return (str.indexOf('UNITED STATES') != -1);
}

Owner.prototype.looksLikeStateOwned = function(str) {
	return (str.indexOf('STATE') != -1);
}

Owner.prototype.looksLikeReligious = function(str, str2) {
	return (str.indexOf('CHURCH') != -1 || str.indexOf('TABERNACLE') != -1 || str.indexOf('MINISTRIES') != -1 || str.indexOf('SYNAGOGUE') != -1 || str2.indexOf('CHURCH') != -1 || str2.indexOf('TABERNACLE') != -1 || str2.indexOf('MINISTRIES') != -1 || str2.indexOf('SYNAGOGUE') != -1);
}

Owner.prototype.looksLikeCharity = function(str) {
	return (str.indexOf('HABITAT') != -1);
}

Owner.prototype.looksLikeTransportationOwned = function(str) {
	return (str.indexOf('CSX') != -1 || str.indexOf('MASS TRANSIT') != -1 || str.indexOf('MARYLAND TRANSIT') != -1);
}

Owner.prototype.getPropertyOwnerType = function() {
	var data = this.getData();
	if (data.owner1 == '') {
		return "UNKNOWN";
	} else {
		if (this.looksLikeCharity(data.owner1)) {
			return "CHARITY";
		} else if (this.looksLikeRental(data.owner1, data.owner2)) {
			return "RENTAL";
		} else if (this.looksLikeBank(data.owner1, data.owner2)) {
			return "RENTAL";
		} else if (this.looksLikeReligious(data.owner1, data.owner2)) {
			return "RELIGIOUS";
		} else if (this.looksLikeBusiness(data.owner1) || this.looksLikeBusiness(data.owner2) || this.looksLikeBusiness(data.owner3)) {
			return "BUSINESS";
		} else if (this.isCityOwned()) {
			return "CITY";
		} else if (this.looksLikeFederal(data.owner1) || this.looksLikeFederal(data.owner2)) {
			return "FEDERAL";
		} else if (this.looksLikeStateOwned(data.owner1)) {
			return "STATE";
		} else if (this.looksLikeTransportationOwned(data.owner1)) {
			return "TRANSPORTATION";
		} else if (this.isOwnerOccupied()) {
			return "PRIVATE";
		} else {
			return "UNKNOWN";
		}
	}
}

Owner.prototype.normalizeOwnerName = function(str) {
	for (var i = 0; i < this.normalizations.length; i++) {
		str = str.replace(this.normalizations[i][0], this.normalizations[i][1]);
	}
	if (str.indexOf('TRF') == 0) {
		str = 'TRF';
	}
	return str.replace(/\d/g, '').trim();
}

Owner.prototype.looksLikeBank = function(str) {
	return (
		(str.indexOf('BANK') != -1 && str.indexOf('BANKS') == -1) ||
		str.indexOf('WELLS FARGO') != -1 ||
		str.indexOf('NATIONAL TRUST') != -1);
}

Owner.prototype.looksLikeBusiness = function(str) {
	return (
		str.indexOf('DEVELOPMENT') != -1 ||
		str.indexOf('INVESTMENT') != -1 ||
		str.indexOf('CORPORATION') != -1 ||
		str.indexOf('LLC') != -1 ||
		str.indexOf('INC') != -1 ||
		str.indexOf('PROPERTIES') != -1 ||
		str.indexOf('TRUST') != -1 ||
		str.indexOf('BUSINESS') != -1);
}

Owner.prototype.looksLikeContinuation = function(str) {
	return this.looksLikeBusiness(str) || (
		str.indexOf('ADMINISTRATION') != -1 ||
		str.indexOf('AUTHORITY') != -1 ||
		str.indexOf('ESTATE') != -1 ||
		str.indexOf('OF BALTIMORE') != -1);
}

Owner.prototype.findOwners = function(str1, str2, str3) {
	// the assumption is that str1 is ALWAYS an owner, the primary owner
	var arr = [this.normalizeOwnerName(str1.trim()), "", ""];
	// if str2 does not start or end in a number, then it's likely an owner name, a secondary owner
	if (/^\d/.test(str2) == false && /\d$/.test(str2.trim()) == false && str2.indexOf('PLAZA') == -1) {
		arr[1] = str2.trim();
		arr[1] = this.normalizeOwnerName(arr[1]);
	}
	// if str3 does not start or end in a number and a secondary owner exists, then it's likely an owner name, a tertiary owner
	if (/^\d/.test(str3) == false && /\d$/.test(str3.trim()) == false && arr[1] != "" && str2.indexOf('PLAZA') == -1) {
		arr[2] = str3.trim();
		arr[2] = this.normalizeOwnerName(arr[2]);
	}
	// if the second owner appears to be part of a continued name, add it to the first line
	if (this.looksLikeContinuation(str2)) {
		arr[0] = arr[0] + ' ' + str2;
		arr[0] = this.normalizeOwnerName(arr[0]);
		arr[1] = "";
	}
	// if the tertieary owner appears to be part of a continued name, add it to the first line
	if (this.looksLikeContinuation(str3)) {
		arr[0] = arr[0] + ' ' + str3;
		arr[0] = this.normalizeOwnerName(arr[0]);
		arr[2] = "";
	}
	return arr;
};

Owner.prototype.createFromRaw = function(rawOwnerObj) {
	this.data.property_address = rawOwnerObj.address;
	this.owner_address.createFromRaw(rawOwnerObj);
	for (var prop in rawOwnerObj) this.data[prop] = rawOwnerObj[prop];
	var newOwnerObj = {};
	var owners = this.findOwners(this.data.owner1, this.data.owner2, this.data.owner3);
	var owner_address = this.owner_address.getData();
	newOwnerObj.owner_name1 = owners[0];
	newOwnerObj.owner_name2 = owners[1];
	newOwnerObj.owner_name3 = owners[2];
	newOwnerObj.owner_type = this.getPropertyOwnerType();
	newOwnerObj.owner_occupied = this.isOwnerOccupied();
	newOwnerObj.owner_address = owner_address.address;
	newOwnerObj.owner_city = owner_address.city;
	newOwnerObj.owner_state = owner_address.state;
	newOwnerObj.owner_zip = owner_address.zip;
	this.setData(newOwnerObj);
	return true;
};

module.exports = Owner;