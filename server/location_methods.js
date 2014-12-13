GetFsqrLoc = function(coords, query){
	var today = moment().format('YYYYMMDD');
	
	try {
		var url = 'https://api.foursquare.com/v2/venues/search?ll=' + coords.latitude +',' + coords.longitude + '&oauth_token=' + fsqrToken + '&limit=' + limit + '&v=20141208';
		if (query)
			if (query.what)
				var url = 'https://api.foursquare.com/v2/venues/search?ll=' + coords.latitude +',' + coords.longitude + '&oauth_token=' + fsqrToken + '&v=20141208&query=' + query.what + '&radius=' + query.radius ;
		var myJSON = Meteor.http.call('GET',url);
		var venues = JSON.parse(myJSON.content);
		return venues;
	} catch(e){
		console.error('error calling fsqr ', e, e.response);
		return false;
	}
	console.log('calling fsqr final. never should come here ', response);
}

GetGoogleLoc = function(userId, coords, radius){
	var response;
	console.log('GetGoogleLoc userLocation ', coords);
/* 	if ((!userLocation.location) && (userLocation.timestamp)) {
		var userLocation = GeoLog.findOne({userId: userId, timestamp: userLocation.timestamp});
		userLocation = userLocation.location;
	} */
	console.log('calling google 1 ', coords);
  try {	
		var location = coords.latitude + ',' + coords.longitude;
		var radius = radius;
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
		url = url +'?location=' + location + '&key=' + google_server_key + '&radius=' + radius
		console.log('calling google 0 ', url);
		var response1 = Meteor.http.call("GET", url);
/*     var response1 = Meteor.http.call("GET", url,
									{params: 
										{
											location: location,
											radius: radius,
											key: google_server_key
										}
									}); */
		response =  JSON.parse(response1.content);
		console.log('response calling google ', response.results.length);
//		Meteor._sleepForMs(1000);
		return response;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
		console.error('error calling google ', e, e.response);
		return false;
  } 
	console.log('calling google final. never should come here ', response);
}

GetGooglePlace = function(place_id){

  try {	
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		parameters = 'placeid=' + place_id + '&key=' + google_server_key;
		var url = 'https://maps.googleapis.com/maps/api/place/details/json?' + parameters;
		console.log('calling google for place vy place_id ', url);
		var response1 = Meteor.http.call("GET", url);
/*     var response1 = Meteor.http.call("GET", url,
									{params: 
										{
											location: location,
											radius: radius,
											key: google_server_key
										}
									}); */
		response =  JSON.parse(response1.content);
//		console.log('response calling google place_id ');
		Meteor._sleepForMs(1000);
		return response;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
		console.error('error calling google place_id ', e, e.response);
		return false;
  } 	
}
	
Meteor.methods({

	getGLoc: function(userId, userLocation, radius){
		var myError;
		// userlocation.coords.latitude
		if ((!userId) || (!userLocation)){
			console.error('Called getGLoc, but ', userId, userLocation);
			return;
		}
		var coords = userLocation.coords;

		if (MerchantsCache.findOne({'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude}))
			return;
		var response = GetGoogleLoc(userId, coords, radius);

		console.log('GetGoogleLoc called google ', userId, userLocation.place_id, response.results.length);
		if (!response) 
			return;
			
		if (!response.results)
			console.error('GetGoogleLoc empty call, increase radius?');
		
		for (var i = 0; i < response.results.length; i++) {		
//			console.log('inserting merchants 0 ', response.results[i].name);
			if (!MerchantsCache.findOne({place_id: response.results[i].place_id, 'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude})) { 
				
				response.results[i].coords = coords;
				response.results[i].updated = new Date(),
				response.results[i].geoId = userLocation.geoId;
				console.log('inserting merchants 1 ', response.results[i].name, response.results[i].name);
				MerchantsCache.upsert(
					{ 'place_id': response.results[i].place_id	},
					{	$set: response.results[i]	}
				);	
			}
		}
		return response;
	},
	
	getGPlace: function(place_id){
		var myError;

		if (MerchantsCache.findOne({place_id: place_id}))
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
		Places.upsert(
			{ 'place_id': response.result.place_id	},
			{
				name: response.result.name,
				place_id: response.result.place_id,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
			}
		);			
		MerchantsCache.upsert(
			{ 'place_id': response.result.place_id	},
			{
				name: response.result.name,
				place_id: response.result.place_id,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
			}
		);
		return response;
	},
	
/* 	ifStatic: function(userId){
		if (!userId) {
			return;
		}
		return GetGoogleLoc(userId, userLocation, radius);
	}, */
});
