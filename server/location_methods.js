GetGoogleLoc = function(userId, userLocation, radius){
var response;

  try {	
		var location = userLocation.latitude + ',' + userLocation.longitude;
		var radius = radius;
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
		console.log('calling google 0 ', url);
    var response = Meteor.http.call("GET", url,
									{params: 
										{
											location: location,
											radius: radius,
											key: google_server_key
										}
									});
//    return true;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
		console.error('error calling google ', e.response);
//    return false;
  } finally {
		response =  JSON.parse(response.content);
//		console.log('response 3 ', response);
		return response;
	}

	console.log('calling google final. never should come here ', response);
}

Meteor.methods({

	getGLoc: function(userId, timestamp, userLocation, radius){
		if (!userId) {
			return;
		}
		return GetGoogleLoc(userId, userLocation, radius);
	},
	
/* 	ifStatic: function(userId){
		if (!userId) {
			return;
		}
		return GetGoogleLoc(userId, userLocation, radius);
	}, */
});
