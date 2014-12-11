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

Meteor.methods({

	getGLoc: function(userId, userLocation, radius){
		var myError;
		// userlocation.coords.latitude
		if (!userId) {
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
			if (!MerchantsCache.find({place_id: response.results[i].place_id, 'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude})) { 
				console.log('inserting merchants 1 ', response.results[i].name);
				response.results[i].coords = coords;
				response.results[i].updated = new Date(),
				response.results[i].geoId = userLocation.geoId;
				MerchantsCache.upsert(
					{ 'place_id': response.results[i].place_id	},
					{	$set: response.results[i]	}
				);	
			}
		}
		return response;
	},
	
/* 	ifStatic: function(userId){
		if (!userId) {
			return;
		}
		return GetGoogleLoc(userId, userLocation, radius);
	}, */
});
