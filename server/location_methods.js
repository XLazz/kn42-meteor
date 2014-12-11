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
		var response = GetGoogleLoc(userId, coords, radius);
		console.log('GetGoogleLoc ', userId, response.results.length, userLocation);
		if (!response) 
			return;
			
		if (!response.results)
			console.error('GetGoogleLoc empty call, increase radius?');
		
		for (var i = 0; i < response.results.length; i++) {		
			console.log('inserting merchants 0 ', response.results[i].name);
			if (!MerchantsCache.findOne({place_id: response.results[i].place_id, 'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude})) { 
				
				response.results[i].coords = coords;
				response.results[i].updated = new Date(),
				response.results[i].geoId = userLocation.geoId;
				console.log('inserting merchants 1 ', response.results[i].name, response.results[i]);
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

		var response = GetGooglePlace(place_id);
		console.log('GetGooglePlace ', place_id, response.result);
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
			response.result
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
