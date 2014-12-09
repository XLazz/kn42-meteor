fsqrApi = function(userId){
	var fsqrToken = Meteor.users.findOne({_id: userId}, {fields:{'services.foursquare.accessToken':1, _id:0}});
	fsqrToken = fsqrToken.services.foursquare.accessToken;
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
		console.log('friends Fsqr http call 2 ', url, friends );
/* 		Friends.upsert(
			{	userId: userId },
			{foursquare: friends}
		) */
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
		console.log('venues Fsqr http call 2', userLocation.user_history_location_id, ' # of results', venues.length, ' url ', url  );
		if (venues.length) {
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
