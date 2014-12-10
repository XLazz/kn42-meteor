GetGoogleLoc = function(userId, userLocation){
	this.unblock();
  try {
		var location = userLocation.latitude + ',' + userLocation.longitude;
		var radius = 50;
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    var result = HTTP.call("GET", url,
									{params: 
										{
											location: location,
											radius: radius,
											key: google_server_key
										}
									});
		console.log('calling google ', result);
    return true;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
		console.error('error calling google ', e);
    return false;
  }
	console.log('calling google 2 ', result);
}

Meteor.methods({

	getGoogleLoc: function(userId, timestamp, userLocation){
		if (!userId) {
			return;
		}
		GetGoogleLoc(userId, userLocation);
	},
});
