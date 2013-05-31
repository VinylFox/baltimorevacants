<?php

header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

include('db.php');

@$resp = array('data' => array(), 'summary' => array(), 'results' => 0, 'error' => '', 'success' => false);

@$param1 = $_GET['var1'];
@$param2 = $_GET['var2'];
@$param3 = $_GET['var3'];
@$param4 = $_GET['var4'];
@$param5 = $_GET['var5'];
@$param6 = $_GET['var6'];

$RADIUS = 6378135;
$MI2ME = 0.000621371192;

$nauticalMilePerLat = 60.00721;
$nauticalMilePerLongitude = 60.10793;

$rad = M_PI / 180.0;
    
$milesPerNauticalMile = 1.15078;
$kmsPerNauticalMile = 1.85200;
$metersPerNauticalMile = 1852;
    
$degreeInMiles = $milesPerNauticalMile * 60;
$degreeInKms = $kmsPerNauticalMile * 60;

$earthradius = 6371.0;

$domain = "data.baltimorecity.gov";
$path = "/api/views/INLINE/rows.json?method=index";
$url = "http://" . $domain . $path;
$token = 'GSoNHBCEoKECW0LC5vClT3pkb';

if(!$param1) $resp['error'] = 'Not sure what you expect me to do';

if ($param1 == 'data') {

    $columnId = 0;
    $uid = $param2;
    $column_name = $param3;

    $col_url = "http://".$domain."/api/views/".$uid."/columns.json";
    //echo "url:".$col_url."|";
    $col_file = file_get_contents($col_url);
    //echo "resp:".$col_file;
    $col_data = json_decode($col_file);
    //$col_data = $col_obj;
    //echo "data:".$col_data[0]->fieldName;
    //echo "length:".count($col_data);

    for ($i = 0; $i < count($col_data); $i++) {
        $column = $col_data[$i];
        //echo "field name:".$column->fieldName;
        if ($column->fieldName == $column_name){
            $columnId = $column->id;
        }
    }

    //echo "columnId:".$columnId."|";

    $lon = round($param4,6);
    $lat = round($param5,6);
    $radius = intval($param6);

    $postdata = json_encode(
        array(
            "originalViewId" => $uid,
            "name" => "Inline View",
            "query" => array(
                "filterCondition" => array(
                    "type" => "operator",
                    "value" => "AND",
                    "children" => array(
                        0 => array(
                            "type" => "operator",
                            "value" => "WITHIN_CIRCLE",
                            "children" => array(
                                0 => array(
                                    "columnId" => $columnId,
                                    "type" => "column"
                                ), 1 => array(
                                    "type" => "literal",
                                    "value" => $lon
                                ), 2 => array(
                                    "type" => "literal",
                                    "value" => $lat
                                ), 3 => array(
                                    "type" => "literal",
                                    "value" => $radius
                                )
                            )
                        )
                    )
                )
            )
        )
    );

    //6hXvZJ8M

    $data_len = strlen($postdata);
    
    //echo json_encode($postdata);

    //echo $data;

    $fp = fsockopen($domain, 80, $undefined, $undefined, 120);

    fputs($fp, "POST $path HTTP/1.0\r\n");
    fputs($fp, "Host: $domain\r\n");
    fputs($fp, "Content-type: application/xml\r\n");
    fputs($fp, "Content-length: " . $data_len . "\r\n");
    fputs($fp, "X-App-Token: " . $token . "\r\n");
    fputs($fp, "Connection: keep-alive\r\n\r\n");
    fputs($fp, $postdata);

    $result = ''; 
    $i = 0;
    $capture = false;
    while(!feof($fp)) {
        $line = trim(strval(fgets($fp, 128)));
        if ($line == "{"){
            $capture = true;
        }
        if ($capture && $line != '' && $line != '0'){
            //echo $i . " : " . $line . "\r\n";
            $result .= preg_replace('/[^(\x20-\x7F)]*/','', $line);
        }
        $i++;
    }

    fclose($fp);

    //echo $result;

    $json_data = json_decode($result);

    //echo $json_data->data;

    if (property_exists($json_data, 'message')){
        $resp['error'] = $json_data->message;        
    }

    if (property_exists($json_data, 'error') && $json_data->error){
        $resp['success'] = false;
    }else{
        $resp['success'] = true;
    }

    if (property_exists($json_data, 'data')){
        $resp['results'] = count($json_data->data);
        $resp['data'] = $json_data->data;
    }else{
        $resp['results'] = 0;
        $resp['data'] = Array();
    }

} else if ($param1 == 'property') {
    if ($param2 == 'geo'){
        $i = 0;
        $lon = round($param3,6);
        $lat = round($param4,6);
        $radius = intval($param5); 
        $lon_rough = round($param3,2);
        $lat_rough = round($param4,2); 
        $base_sql = "SELECT * FROM property_tax WHERE lon = " . strval($lon_rough) . " AND lat = " . strval($lat_rough);
        $base_query = mysql_query($base_sql);
        while($row = mysql_fetch_array($base_query)) {
            $lat1 = $lat;
            $lon1 = $lon;

            $lat2 = $row['lat'];
            $lon2 = $row['lon'];
            
            if ($lat2 != 0 && $lon2 != 0){

                $yDistance = ($lat2 - $lat1) * $nauticalMilePerLat;
                $xDistance = (cos($lat1 * $rad) + cos($lat2 * $rad)) * ($lon2 - $lon1) * ($nauticalMilePerLongitude / 2);
            
                $distance = sqrt(pow($yDistance, 2) + pow($xDistance, 2));
                if ($unit == 'mi'){
                    $dist = $distance * $milesPerNauticalMile;
                }else{
                    $dist = $distance * $metersPerNauticalMile;
                }

                $distance_m = round($dist,4);
                if ($distance_m <= $radius){
                    $resp['data'][$i] = array('distance_m' => $distance_m, 'tag' => $row['tag'], 'count' => intval($row["total_tag"],10), 'tot_fine' => floatval($row["total_tag_fine_amt"]));
                    $i = $i+1;
                }
            }
        }
        $resp['results'] = $i;
        $resp['success'] = true;
    } else if ($param2 == 'blocklot'){

    } elseif ($param2 == 'address') {
        
    }

} else if ($param1 == 'geocode') {
    $geo_query = "http://where.yahooapis.com/geocode?q=" . urlencode($param2) . "&flags=J&appid=dj0yJmk9ZHBNNGx0OVZFZDBrJmQ9WVdrOU1FTkZObkZsTkRRbWNHbzlNVEkzTmpnME5qTTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD01Mw--";
    $file = file_get_contents($geo_query);
    $addr = json_decode($file);
    if ($addr->ResultSet->Found == 1 and $addr->ResultSet->Quality > 80){
        $result = $addr->ResultSet->Results[0];
        $lat = $result->latitude;
        $lng = $result->longitude;
        $resp['data'][0] = array('uid' => $result->woeid, 'address' => $param2, 'quality' => $result->quality, 'location_geo' => array('lat' => $lat, 'lon' => $lng));
    }
} else if ($param1 == 'owner') {
    
}

echo json_encode($resp);

mysql_close();

?>
