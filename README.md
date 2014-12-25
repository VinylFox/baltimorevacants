Initial Loading of Data:

1 ) Grab the parcel shape file from OpenBaltimore - https://data.baltimorecity.gov/Geographic/Parcels-Shape/jk3c-vrfy
2 ) Convert the file to GeoJSON
	- This can be done with QGis
	- Layer -> Add Layer -> Vector File -> Select the parcel.shp file as the 'Source' and click 'Open'
	- Vector -> Geometry Tools -> Simplify Geometires -> Set 'Simplify tolerance' to 20 and click 'Ok'
	- Layer -> Save As -> Select CRS as 'Selected SRC' and click 'Change', select 'WGS 84' and click 'Ok', set a 'Save As' file and click 'Ok'
3 ) Grab the neighborhood shape file (called Baltimore Study Area) from OpenBaltimore - https://data.baltimorecity.gov/Geographic/Baltimore-Study-Area/cdrh-gpzc
4 ) Convert the file to GeoJSON
Right click on the layer and select "Filter", then enter this filter in the window '"FULLADDR" != "0" AND "FULLADDR" != "NULL"'