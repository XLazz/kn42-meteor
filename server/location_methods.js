Meteor.methods({

	getGLoc: function(userId, params, initiator){
		var myError;
		// userlocation.coords.latitude
		if ((!userId) || (!params.location) ){
			console.error('Called getGLoc, but ', userId, params.location, params.geoId, initiator, params);
			return;
		}
		console.log('Called getGLoc 2 ', userId, 'geoId ', params.geoId, initiator);
		if (!params.location.coords) {
			console.error('Called getGLoc, but location.coords ', params.location.coords, params.location, initiator);
			return;		
		}

		var coords = params.location.coords;

/* 		if (MerchantsCache.findOne({'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude}))
			return; */
		if (!params.name) {
			var name = '';
		} else {
			var name = params.name;
		}
		var response = GetGoogleLoc(userId, coords, params.radius, name);

//		console.log('GetGoogleLoc called google ', userId, coords, response.results.length);
		if (!response) 
			return;
			
		if (!response.results)
			console.error('GetGoogleLoc empty call, increase radius?');
		
		for (var i = 0; i < response.results.length; i++) {		
//			console.log('inserting merchants 0 step ', i, ' response ', response.results[i].name);
			if (!MerchantsCache.findOne({place_id: response.results[i].place_id, 'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude})) { 			
				response.results[i].coords = coords;
				response.results[i].updated = moment().valueOf(),
				console.log('inserting merchants 1 ', response.results[i].place_id, response.results[i].name);
				MerchantsCache.upsert(
					{ 'place_id': response.results[i].place_id	},
					{	$set: response.results[i]	}
				);	
			}
			if (params.geoId) {
				if (i == 0) {
	//				console.log('upserting GeoLog for geoId ', params.geoId, ' with place_id ', response.results[i].place_id); 
					GeoLog.upsert(params.geoId, {$set: {place_id: response.results[i].place_id}});
				}
				if (i == 1) {
	//				console.log('upserting GeoLog for geoId ', params.geoId, ' with stat place_id ', response.results[i].place_id); 
					GeoLog.upsert(params.geoId, {$set: {stationary_place_id: response.results[i].place_id}});
				}
			}
		}
		ifStationary (userId, params.geoId);
		return response;
	},
	
	getGPlace: function(place_id){
		var userId;
		if (!place_id)
			return;
		var myError;

		if (MerchantsCache.findOne({place_id: place_id}))
			return;
		if (Places.findOne({place_id: place_id}))
			return;
		// Meteor._sleepForMs(200);
		// if (MerchantsCache.findOne({place_id: place_id}))
			// return;
		var response = GetGooglePlace(place_id);
		console.log('GetGooglePlace ', place_id, response.result.name);
		if (!response) {
			console.error('GetGooglePlace empty call');
			return;
		}			
		if (!response.result) {
			console.error('GetGooglePlace empty call');
			return;
		}		
//		console.log('GetGooglePlace call', response.result);
		Places.upsert(
			{ 'place_id': response.result.place_id	},
			{
				place_id: response.result.place_id,
				name: response.result.name,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
				updated: moment().valueOf(),
			}
		);			
		MerchantsCache.upsert(
			{ 'place_id': response.result.place_id	},
			{
				place_id: response.result.place_id,
				name: response.result.name,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
				updated: moment().valueOf(),
			}
		);
		return response;
	},
	
	googleMaps: function(params) {
		var result = GoogleMaps.getDistance("Melbourne", "Sydney");
		console.log(result);
		
		var content;
		var data = GoogleMaps.distance(
				"100 East Main Street, Louisville KY, 40202",
				"1500 Bardstown Rd, Louisville, KY 40205",
				function (error, data, content) {
					console.log('transit data ', data, ' content ', content);
					if (error) {
						console.log(error);
					}
					console.log(data.rows[0].elements[0]);
					return {results: result, data: data, content: content};
				},
				'false',
				'transit',
				result
		);
	},

	googleMapsPlaces: function(params) {
		params.google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		console.log('googleMapsPlaces 0 ', params, result);
		var result = GoogleMaps.places(
		params.latlng,
		params.radius,
		params.google_server_key,
		function (error, data) {
			console.log('places ');
			if (error) {
				console.error(error);
				return;
			}
			data.foursquareId = params.foursquareId
			updatePlace(data);
			return data;
		},
		params.sensor,
		params.types,
		params.lang,
		params.name,
		params.rankby, 
		params.pagetoken
		);
		console.log('googleMapsPlaces 1 ', result);
		return result;
	},

	googleMapsReverse: function(userId, gps, initiator) {	
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		GoogleMaps.config({
			'google-private-key': google_server_key,
			'stagger-time': 200,
			'encode-polylines': true,
			'secure': false,
			'proxy': null,
		});
		GoogleMaps.distance(
    "100 East Main Street, Louisville KY, 40202",
    "1500 Bardstown Rd, Louisville, KY 40205",
    function (error, data) {
      console.log('transit', data);
      if (error) {
        console.log(error);
				return;
      }
      console.log(data.rows[0].elements[0]);
      /* expect = {
        distance: { text: '5.4 km', value: 5447 },
        duration: { text: '9 mins', value: 552 },
        status: 'OK'
      } */
    },
    'false',
    'transit'
		);
		var place = GoogleMaps.reverseGeocode(gps, function (error, result) {
			console.log('result');
			if (error) {
				console.error(error);
				return;
			}
//			console.log(result.rows[0].elements[0]);
			/* expect = {
				distance: { text: '5.4 km', value: 5447 },
				duration: { text: '9 mins', value: 552 },
				status: 'OK'
			} */
			return result;
		});
	},	
	
	

	
});
