var Address = function(config) {
    this.init(config);
};

Address.prototype.init = function(config) {
    for (var prop in config) this[prop] = config[prop];
    this.data = this.data || {
        address: '',
        city: '',
        state: '',
        zip: '',
        owner1: '',
        owner2: '',
        owner3: '',
        owner4: ''
    };
};

Address.prototype.getData = function() {
    return this.data;
};

Address.prototype.setData = function(data) {
    this.data = data;
};

Address.prototype.looksLikeAnAddress = function(str) {
    return (/^\d/.test(str) == true || str.indexOf('PO') == 0 || str.indexOf('PLAZA') != -1 || str.indexOf('SUITE') != -1);
}

Address.prototype.looksLikeCityStateZip = function(str) {
    var splitStr = str.split(' '),
        numlen = splitStr[splitStr.length - 1].replace(/[a-zA-Z, ]/g, '').length;
    return (/^\d/.test(str) == false && /\d$/.test(str.trim()) && str.indexOf('PO') != 0 && str.indexOf('#') == -1 && str.indexOf(' LN ') == -1 && numlen >= 5);
}

Address.prototype.splitAddressCityStateZip = function(str3, str4) {
    var arr = ["", "", ""],
        tmp, tmp1, str;
    if (this.looksLikeCityStateZip(str3)) {
        str = str3;
    } else if (this.looksLikeCityStateZip(str4)) {
        str = str4;
    } else {
        str = '';
    }
    tmp1 = str.split(' ');
    tmp = tmp1.filter(function(v) {
        return v !== '';
    });
    if (tmp.length > 2 && /\d/.test(tmp[tmp.length - 1]) && tmp[tmp.length - 2].length == 2) {
        arr[1] = tmp[tmp.length - 2];
        arr[2] = tmp[tmp.length - 1];
        tmp.pop();
        tmp.pop();
        arr[0] = tmp.join(' ');
    }
    arr[0] = arr[0].replace(',', '');
    arr[1] = arr[1].replace(',', '');
    return arr;
};

Address.prototype.createFromRaw = function(rawAddrObj) {
    for (var prop in rawAddrObj) this.data[prop] = rawAddrObj[prop];
    var addr = this.splitAddressCityStateZip(this.data.owner3, this.data.owner4);
    if (this.looksLikeAnAddress(this.data.owner2) && this.looksLikeAnAddress(this.data.owner3)) {
        rawAddrObj.address = this.data.owner2 + ' ' + this.data.owner3;
    } else if (this.looksLikeAnAddress(this.data.owner2)) {
        rawAddrObj.address = this.data.owner2;
    } else if (this.looksLikeAnAddress(this.data.owner3)) {
        rawAddrObj.address = this.data.owner3;
    } else if (this.looksLikeAnAddress(this.data.owner4)) {
        rawAddrObj.address = this.data.owner4;
    }
    rawAddrObj.city = addr[0];
    rawAddrObj.state = addr[1];
    rawAddrObj.zip = addr[2];
    this.setData(rawAddrObj);
    return true;
};

module.exports = Address;