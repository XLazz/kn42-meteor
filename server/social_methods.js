fsqrApi = function(userId){
	var user_details = Meteor.users.findOne({_id: userId});
	if (!user_details)
		return;
	if (!user_details.profile.foursquareId)
		Meteor.users.upsert({_id: userId}, {$set:{'profile.foursquare':1, 'profile.foursquareId': user_details.services.foursquare.id}});
	fsqrToken = user_details.services.foursquare.accessToken;
	console.log ('token ', fsqrToken);
	return fsqrToken;
}

Meteor.methods({

	'friendsFsqr': function(userId){
		console.log('friends Fsqr userId ', userId );
		var fsqrToken = fsqrApi(userId);
		if (!fsqrToken) {
			console.error('no Fsqr token');
			return;
		}
		var today = moment().format('YYYYMMDD');
		var url = 'https://api.foursquare.com/v2/users/self/friends?oauth_token=' + fsqrToken +'&v=20141208';
		console.log('friends Fsqr http call 1 ', today, url );
		var myJSON = Meteor.http.call('GET',url);
		var friends = JSON.parse(myJSON.content);
		var friends = friends.response.friends.items;
		console.log('friends Fsqr http call 2 for ', userId, url, friends.length );
		Friends.upsert(
			{	userId: userId },
			{userId: userId, foursquare: friends}
		)
		return friends;
	},
	
	'venuesFsqr': function(userId, userLocation, query){
		console.log('venues Fsqr userId ', userLocation.name, query );
		var fsqrToken = fsqrApi(userId);
		var limit = 10;
		if (!fsqrToken) {
			console.error('no Fsqr token');
			return;
		}
		var today = moment().format('YYYYMMDD');
		if (query.what) {
			var url = 'https://api.foursquare.com/v2/venues/search?ll=' + userLocation.latitude +',' + userLocation.longitude + '&oauth_token=' + fsqrToken + '&v=20141208&query=' + query.what + '&radius=' + query.radius ;
		} else {
			var url = 'https://api.foursquare.com/v2/venues/search?ll=' + userLocation.latitude +',' + userLocation.longitude + '&oauth_token=' + fsqrToken + '&limit=' + limit + '&v=20141208';
		}
		var myJSON = Meteor.http.call('GET',url);
		var venues = JSON.parse(myJSON.content);
		var venues = venues.response.venues;
		
		if (venues.length !== 0) {
			console.log('venues Fsqr http call 2 update ', userLocation.user_history_location_id, ' # of results', venues.length, ' url ', url  );
			VenuesCache.upsert(
				{	
					userId: userId,
					latitude: userLocation.latitude,
					longitude: userLocation.longitude,
				},
				{
					userId: userId,
					latitude: userLocation.latitude,
					longitude: userLocation.longitude,
					updated: moment().valueOf(),
					foursquare: venues
				}
			) 
		} else {
			console.log('venues Fsqr http call 2 remove ', userLocation.user_history_location_id, ' # of results', venues.length, ' url ', url  );
			VenuesCache.remove(
				{	
					userId: userId,
					latitude: userLocation.latitude,
					longitude: userLocation.longitude,
				}
			) 		
		
		}
		return venues;		
	},
	
	removevenuesFsqr: function(){
		VenuesCache.remove({});
	},
});

