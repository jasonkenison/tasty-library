/*
 * jquery.library.js
 *
 * Copyright 2013, Jason Kenison - http://jasonkenison.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  https://github.com/jasonkenison/tasty-library
 * Version: 0.1
 */
 
 /**
 * on load, pull in the library data and set up the page
 */
$(document).ready(function(){
	// get data from json object, done only once on load
	$.getJSON('data/library.json', function(data) {
		$.fn.items = data.items;
		$.fn.shelves = data.shelves;
		
		// create select box
		listShelves();
		
		// list all items in the first shelf
		//firstShelf = $.fn.shelves[0].id; // first in the json data, or
		firstShelf = 'Vinyl'; // ''; //show all
		$.fn.selectedShelf = firstShelf;
		listItems(firstShelf);
		
		// set the search form onsubmit action
		$('#searchForm').submit(function() {
			searchTerm = $('#searchBox').val();
			if(searchTerm != ''){
				listItems(false, false, searchTerm);
			}
			return false;
		});
		
		// default view
		$.fn.viewAs = 'viewAsIcon';
		setView($.fn.viewAs);
		
		// toggle button changes setView
		$('.toggleView').click(function(){
			setView();
		});
	});
});

/**
 * create list of shelves with links
 */
function listShelves(){
	var options = '';
	
	// include option to show all
	//options += '<option value="">Show All</option>';
	
	$.each($.fn.shelves, function (key, shelf) {
		options += '<option value="' + shelf['id'] + '">' + shelf['title'] + '</option>';
	});
	
	$("#shelves").html(options);
	$("#shelves").change(function(){
		// clear out search box
		$('#searchBox').val('');
		
		//list items for selected shelf
		shelf = $(this).val();
		listItems(shelf);
		$.fn.selectedShelf = shelf;
		$.fn.close_modal('itemDetail');
	});
}

/**
 * list items
 * optional shelf, type and/or search passed in
 */
function listItems(shelf, type, search, sort){
	items = $.fn.items;
	searchNote = 'Showing all items';
	
	if(shelf || (!shelf && $.fn.selectedShelf)){
		if(shelf === false){
			shelf = $.fn.selectedShelf;
		}
		items = filterItems('shelf', shelf, items);
		$.each($.fn.shelves, function (key, val) {
			if(val.id == shelf){
				shelfName = val.title;
			}
		});
		searchNote = 'All ' + shelfName;
	}
	
	if(search){
		items = filterItems('search', search, items);
		searchNote = 'Search results for "' + search + '"';
	}

	// default to alphabetical sorting
	if(!sort) sort = 'title';

	if(sort){
		items = sortByKey(items, sort);
	}

	$('#searchNote').html(searchNote);
	
	$('#items').html('');
	if(items.length > 0){
		$.each(items, function(key, item) {
			var html = itemBlockHtml(item, key);
			$('#items').append(html);
		});
		
		// populate embed code before opening modal
		$('a[id*=itemDetailLink]').click(function(){
			var key = $(this).data('item');
			var itemDetailBlock = itemBlockHtml(0, key);
			$('#itemDetailContents').html(itemDetailBlock);
		});
		
		// enable modal links
		$('a[rel*=leanModal]').leanModal({
			top : 200, 
			overlay : 0.4, 
			closeButton: ".modal_close" 
		});
		
		$("img.lazy").lazyload();
		
	} else {
		$('#items').append('<div class="error">No items matching this criteria</div>');
	}
}

/**
 * list items
 * optional shelf, type and/or search passed in
 * can filter by one metric at a time: shelf or type
 */
function filterItems(by, value, items){
	if(!value || value == ''){
		return items;
	}
	
	var debug = '';
	var filteredItems = [];
	$.each(items, function(key, item) {
		if(by == 'shelf'){
			if(String(value) == String(item.shelf)){
				debug += item.title + "\n";
				filteredItems.push(item);
			}
			
		} else if(by == 'search'){
			if(	(String(item.title).toLowerCase().indexOf(String(value).toLowerCase()) >= 0) || 
				(String(item.creator).toLowerCase().indexOf(String(value).toLowerCase()) >= 0)
				){
				debug += item.title + "\n";
				filteredItems.push(item);
			}
		}
	});
	
	//alert(debug);
	return filteredItems;
}

/**
 * sort an array by key
 */
function sortByKey(array, key){
	return array.sort(function(a, b) {
		var x = a[key]; var y = b[key];
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});
}

/**
 * html for item blocks
 * same function for listing and detail in-modal
 */
function itemBlockHtml(item, key){
	itemBlock = '';
	listType = 'list'; // default list

	if(!item){
		getItemById(key);
		item = $.fn.itemDetail;
		listType = 'detail'; // populate modal
	}
	
	if(listType == 'list'){
		itemBlock += '<a class="item" href="#itemDetail" rel="leanModal" id="itemDetailLink" data-item="' + item.id + '">';
	} else {
		itemBlock += '<div class="itemDetail">';
	}
	
	if(listType == 'list'){
		itemBlock += 	'<img class="lazy" data-original="covers/' + item.image + '" src="images/loading.gif" alt="' + item.title + '" />';
	} else {
		itemBlock += 	'<img src="covers/' + item.image + '" alt="' + item.title + '" />';
	}
	
	itemBlock += 	'<div class="info">';
	itemBlock += 		'<div class="title">' + item.title + '</div>';
	
	if(item.creator != ''){
		if(listType == 'list' && item.creator.length > 25){
			item.creator = item.creator.substring(0,25) + listType + '...';
		}
		itemBlock += 	'<div class="creator">' + item.creator + '</div>';
	}
	
	if(item.type != '' && listType != 'detail'){
		itemBlock += 	'<div class="type"><b>Type:</b><br />' + item.type + '</div>';
	}
	
	/* 
	// descriptions don't really fit well
	if(listType == 'detail'){
		itemBlock += 		'<div class="description">' + item.description + '</div>';
	}
	*/
	
	itemBlock += 	'</div>';
	
	if(listType == 'list'){
		itemBlock += '</a>';
	} else {
		itemBlock += '</div>';
	}
	
	return itemBlock;
}

/**
 * return item by key
 */
function getItemById(id){
	$.each($.fn.items, function(key, item) {
		if(String(item.id) == String(id)){
			$.fn.itemDetail = item;
			return false;
		}
	});
}

/**
 * toggle view between icon (covers only) and list (cover in white block with details)
 */
function setView(viewId){
	if(viewId){
		$.fn.viewAs = viewId;
	} else {
		if($.fn.viewAs == 'viewAsIcon'){
			$.fn.viewAs = 'viewAsList';
		} else {
			$.fn.viewAs = 'viewAsIcon';
		}
	}
	
	// remove selected class from both
	$('#viewAsIcon').removeClass('selected');
	$('#viewAsList').removeClass('selected');
	
	// add selected class to one
	$('#' + $.fn.viewAs).addClass('selected');
	
	// toggle view classes
	$('#items').attr('class', $.fn.viewAs);
}



