<?php
/*
 * create.php
 *
 * Copyright 2013, Jason Kenison - http://jasonkenison.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  https://github.com/jasonkenison/tasty-library
 * Version: 0.1
 */

/**
 * get library into database, then use this to creat json
 * save file as data/library.json
 */

// omit output to include only specific shelves by name, or set to false to include all
$shelvesToInclude = array('Vinyl', 'DVD Movies', 'HD DVD Movies', 'Blu-Ray Movies', 'xbox360 Games', 'PS3 Games', 'PC Games', 'Wii Games', 'DS/3DS Games', 'NES Games', 'Tech Books');
//$shelvesToInclude = false;

$connection = mysql_connect('localhost', 'root', 'root');
if(!$connection) exit('Could not connect: ' . mysqli_connect_error());
mysql_select_db('test');

// line ending
$le = "\n";

$itemsAdded = array();
$shelvesArray = array();
$items = '';
$shelves = '';
$q = mysql_query("SELECT * FROM `library` ORDER BY `id` ASC");
while($qd = mysql_fetch_assoc($q)){
	if(	((is_array($shelvesToInclude) && in_array($qd['shelves'], $shelvesToInclude)) || !$shelvesToInclude) && 
		!in_array($qd['unique_key'], $itemsAdded)
		){
		$items .= '
			{	
			"id": "'.$qd['unique_key'].'",
			"image": "'.$qd['unique_key'].'-256.png",
			"title": "'.str_replace('"','',$qd['title']).'",
			"creator": "'.str_replace('"','',$qd['creator']).'",
			"description": "", 
			"amazonUrl": "",
			"asin": "",
			"type": "'.$qd['item_type'].'",
			"shelf": "'.$qd['shelves'].'"
		},'.$le;
		
		$itemsAdded[] = $qd['unique_key'];
	}
		
	if(!in_array($qd['shelves'], $shelvesArray)){
		$shelvesArray[$qd['shelves']] = $qd['shelves'];
	}
}

foreach($shelvesArray as $key => $val){
	if((is_array($shelvesToInclude) && in_array($key, $shelvesToInclude)) || !$shelvesToInclude){
		$shelves .= '
		{	
			"id": "'.$key.'",
			"title": "'.$val.'"
		},'.$le;
	}
}

// start the json object with user info
$json = '{
	"username": "",
	"collection": "",
	"updated": "'.date('Y-m-d\TH:i:s\Z').'",
	"generator": "",
	"shelves": [
		'.substr($shelves, 0, (strlen($shelves) - 2)).'
	],
	"items": [
		'.substr($items, 0, (strlen($items) - 2)).'
	]
}';

header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

echo $json;

/*

== database schema ==

CREATE TABLE `library` (
  `amazon_link` varchar(255) DEFAULT NULL,
  `cinematographer` varchar(255) DEFAULT NULL,
  `composer` varchar(255) DEFAULT NULL,
  `creator` varchar(255) DEFAULT NULL,
  `item_type` varchar(255) DEFAULT NULL,
  `release_date` varchar(255) DEFAULT NULL,
  `screenwriter` varchar(255) DEFAULT NULL,
  `shelves` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `unique_key` varchar(255) DEFAULT NULL,
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

*/

?>