delimiter $$

CREATE TABLE `property` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ward` int(11) DEFAULT NULL,
  `sect` char(3) DEFAULT NULL,
  `block` char(4) DEFAULT NULL,
  `lot` char(3) DEFAULT NULL,
  `address` varchar(128) DEFAULT NULL,
  `address_lat` float DEFAULT NULL,
  `address_lon` float DEFAULT NULL,
  `boundary_last_edit` date DEFAULT NULL,
  `area` float DEFAULT NULL,
  `pin` varchar(64) DEFAULT NULL,
  `property_type` int(11) DEFAULT NULL,
  `neighborhood_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=33 DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `property_owners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ownerDetail1` varchar(128) DEFAULT NULL,
  `ownerDetail2` varchar(128) DEFAULT NULL,
  `ownerDetail3` varchar(128) DEFAULT NULL,
  `ownerDetail4` varchar(128) DEFAULT NULL,
  `aliasOf` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ownerDetail1` (`ownerDetail1`)
) ENGINE=MyISAM AUTO_INCREMENT=51675 DEFAULT CHARSET=latin1$$


delimiter $$

CREATE TABLE `property_shape` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `lon` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `property_tax` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ownerId` int(11) NOT NULL,
  `ward` int(11) DEFAULT NULL,
  `sect` int(11) DEFAULT NULL,
  `block` char(6) DEFAULT NULL,
  `lot` char(6) DEFAULT NULL,
  `propertyAddress` varchar(128) DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `lon` float DEFAULT NULL,
  `lotSize` varchar(45) DEFAULT NULL,
  `cityTax` float DEFAULT NULL,
  `stateTax` float DEFAULT NULL,
  `resCode` tinyint(4) DEFAULT NULL,
  `amountDue` float DEFAULT NULL,
  `asOfDate` date DEFAULT NULL,
  `accountNumber` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `BLOCKLOT` (`block`,`lot`)
) ENGINE=MyISAM AUTO_INCREMENT=236383 DEFAULT CHARSET=latin1$$