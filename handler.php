<?php

error_reporting(E_ERROR | E_PARSE);

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

@$city = 'Baltimore';

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

    $lon = round($param4,6);
    $lat = round($param5,6);
    $radius = intval($param6);

    $cachefile = './cache/'.$uid.'_'.strval($lon).'_'.strval($lat).'_'.strval($radius).'.json';
    if (file_exists($cachefile)){
        $result = file_get_contents($cachefile);
        $items = json_decode($result);
        $datalen = count($items);
        $json_data = Array();
    }else{

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

        $items = Array();
        for ($i=0;$i<count($json_data->data);$i++){
            $items[] = Array(
                $json_data->data[$i][8],
                $json_data->data[$i][9],
                $json_data->data[$i][10],
                $json_data->data[$i][11],
                $json_data->data[$i][12],
                Array(
                    $json_data->data[$i][13][1],
                    $json_data->data[$i][13][2]
                )
            );
        }

        $datalen = count($items);
    
        $fp = fopen($cachefile, 'w');
        fwrite($fp, json_encode($items)); 
        fclose($fp);
    }

    if ($uid = 'qqcv-ihn5'){
        $neighborhoods = Array();
        for ($i=0;$i<$datalen;$i++){
            if (!in_array($items[$i][2], $neighborhoods)){
                $neighborhoods[] = $items[$i][2];
            }
        }
        $resp['summary']['neighborhoods'] = $neighborhoods;
        for ($i=0;$i<count($neighborhoods);$i++){
            $base_sql = "SELECT * FROM csa_to_nsa WHERE nsa_name = '" . strval($neighborhoods[$i]) . "'";
            $base_query = mysql_query($base_sql);
            while($row = mysql_fetch_array($base_query)) {
                $cachefile = './cache/bnia_'.preg_replace("/[^A-Za-z0-9 ]/Usi",'_',str_replace(' ', '_', $row['csa_name'])).'.json';
                if (file_exists($cachefile)){
                    $resp['summary']['bniacached'] = true;
                    $bnia_resp = file_get_contents($cachefile);
                }else{
                    $resp['summary']['bniacached'] = false;
                    $bnia_resp = file_get_contents('http://bniajfi.org/getIndicator.php?bound='.urlencode($row['csa_name']).'&iYear=2012', true);
                    $fp = fopen($cachefile, 'w');
                    fwrite($fp, $bnia_resp); 
                    fclose($fp);
                }
                $bnia_data = json_decode($bnia_resp, true);
                $bnia_object = Array();
                if ($bnia_data[0]['Data'][0]['Boundary'] !== null){
                    $bnia_object['csa'] = $bnia_data[0]['Data'][0]['Boundary'];
                    for ($k=0;$k<count($bnia_data);$k++){
                        if (isset($bnia_data[$k]['Data'][0]['Result']) && $bnia_data[$k]['Data'][0]['Result'] !== 'NA'){
                            $bnia_object[$bnia_data[$k]['ShortName']] = $bnia_data[$k]['Data'][0]['Result'];
                        }
                    }
                }else{
                    $bnia_object['csa'] = $row['csa_name'].' Not Found';
                }

                $coordinates = Array();
                $base_sql_c = "SELECT f.name, p.lat, p.lon FROM geo_feature f LEFT JOIN geo_feature_point p ON f.id = p.geo_feature_id WHERE f.type = 'csa' AND f.name = '".$row['csa_name']."'";
                $base_query_c = mysql_query($base_sql_c);
                while($row_c = mysql_fetch_array($base_query_c)) {
                    $coordinates[] = array(floatval($row_c['lon']),floatval($row_c['lat']));
                }

                $bnia_object['coordinates'] = $coordinates;
                $resp['summary']['bnia'][preg_replace("/[^A-Za-z0-9 ]/Usi",'_',str_replace(' ', '_', $neighborhoods[$i]))] = $bnia_object;
            }
        }
    }

    if (property_exists($json_data, 'message')){
        $resp['error'] = $json_data->message;        
    }

    if (property_exists($json_data, 'error') && $json_data->error){
        $resp['success'] = false;
    }else{
        $resp['success'] = true;
    }

    if (property_exists($json_data, 'data') || count($items) > 0){
        $resp['results'] = count($items);
        $resp['data'] = $items;
    }else{
        $resp['results'] = 0;
        $resp['data'] = Array();
    }

} else if ($param1 == 'csa') {

    $data = array();
    $coordinates = array();
    $csa = '';

    $base_sql_c = "SELECT f.name, p.lat, p.lon FROM geo_feature f LEFT JOIN geo_feature_point p ON f.id = p.geo_feature_id WHERE f.type = 'csa'";
    $base_query_c = mysql_query($base_sql_c);
    while($row_c = mysql_fetch_array($base_query_c)) {
        if ($csa != '' && $csa !== $row_c['name']){
            $data[] = array(
                "name" => $csa,
                "coordinates" => $coordinates
            );
            $coordinates = array();
            $coordinates[] = array(floatval($row_c['lon']),floatval($row_c['lat']));
        } else {
            $coordinates[] = array(floatval($row_c['lon']),floatval($row_c['lat']));
        }
        $csa = $row_c['name'];
    }

    $resp['data'] = $data;

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
} else if ($param1 == 'owner_name') {
    
    $collection = $db->property;
    $query = array('$text' => array('$search' => strtoupper($param2)));
    //$query = array('owner_occupied' => true);
    $cursor = $collection->find($query);

    $i = 0;

    foreach ($cursor as $obj) {
        if ($i < 50) {
            $resp['data'][] = $obj;
        }
        $i++;
    }

    $resp['results'] = $cursor->count();
    $resp['success'] = true;

} else if ($param1 == 'summary') {
    
    $collection = $db->property;
    $query = array(
                array(
                    '$match' => array(
                        'owner_occupied' => false, 
                        'city_owned' => false
                    )
                ),
                array( 
                    '$group' => array(
                        '_id' => '$'.$param2,
                        'totalSize' => array(
                            '$sum' => 1
                        )
                    )
                ),
                array(
                    '$sort' => array(
                        'totalSize' => -1
                    )
                )
            );
    $query[0]['$match'][$param2] = array(
        '$ne' => ''
    );
    $resp['error'] = $query;
    $cursor = $collection->aggregate($query);

    $resp['data'] = $cursor['result'];

    $resp['results'] = count($resp['data']);
    $resp['success'] = true;

} else if ($param1 == 'owner_state') {
    
    $collection = $db->property;
    $query = array(
                array(
                    '$match' => array(
                        'owner_occupied' => false, 
                        'city_owned' => false,
                        'owner_state' => array(
                            '$ne' => ''
                        )
                    )
                ),
                array( 
                    '$group' => array(
                        '_id' => '$owner_state',
                        'totalSize' => array(
                            '$sum' => 1
                        )
                    )
                ),
                array(
                    '$sort' => array(
                        'totalSize' => -1
                    )
                )
            );
    $cursor = $collection->aggregate($query);

    $resp['data'] = $cursor['result'];

    $resp['results'] = count($resp['data']);
    $resp['success'] = true;

} else if ($param1 == 'autocomplete') {

    $geo_query = "https://maps.googleapis.com/maps/api/place/autocomplete/json?sensor=false&input=" . urlencode($param2) . "&key=AIzaSyCpq4isEKP2F86bk578zz8MS3V9Fo69Afk&location=39.331267,-76.632679&radius=200&type=street_address&components=country:us";
    $file = file_get_contents($geo_query);
    $addr = json_decode($file);
    $m = count($addr->predictions);
    //echo $addr;
    $resp['error'] = $param1 . '|' . $param2 . '|' . $param3 . '|' . $geo_query;
    if ($addr->status == "OK" and count($addr->predictions) > 0){
        $result = $addr->predictions;
        for($k=0;$k<count($result);$k++){
            $hasCity = false;
            for($l=0;$l<count($result[$k]->terms);$l++){
                if ($city == $result[$k]->terms[$l]->value){
                    $hasCity = true;
                }
            }
            if ($hasCity){
                $resp['data'][] = array('uid' => $result[$k]->id, 'address' => $result[$k]->terms[0]->value, 'full_address' => $result[$k]->description);
                $m++;
            }
        }
        $resp['success'] = true;
        $resp['results'] = $m;
    }else{
        $resp['success'] = false;
        $resp['results'] = 0;
    }

}

echo json_encode($resp);

mysql_close();

?>
