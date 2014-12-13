fsqrApi = function(userId){
	var user_details = Meteor.users.findOne({_id: userId});
	console.log('fsqrAPI ', userId, user_details);
	if (!user_details)
		return;
	if (user_details.services.foursquare) {
		fsqrToken = user_details.services.foursquare.accessToken;
		console.log ('token ', fsqrToken);
		if ((!user_details.profile.foursquareId)||(!user_details.profile.foursquare)) 
			Meteor.users.upsert({_id: userId}, {$set:{'profile.foursquare':1, 'profile.foursquareId': user_details.services.foursquare.id}});
		return fsqrToken;
	}
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
	
	'venuesFsqr': function(userId, coords, query){
		
		var fsqrToken = fsqrApi(userId);
		console.log('venues Fsqr userId ', userId, fsqrToken, coords );
		if (!coords)
			return
		if (!coords.latitude)
			return
		var limit = 10;
		if ((!fsqrToken) && (!query)){
			console.error('no Fsqr token or query ');
			return;
		}
		var venues = GetFsqrLoc (coords, query);
		if (!venues)
			return;
		venues = venues.response.venues;
		
		if (venues.length !== 0) {
			console.log('venues Fsqr http call 2 update ', coords, ' # of results', venues.length, ' url ', url  );
			venues.forEach(function (item, index, array) {
				item.updated = moment().valueOf();
				VenuesCache.upsert({id: item.id},item);
			});
		} else {
			console.log('venues empty ', coords, ' # of results', venues.length, ' url ', url  );
/* 			VenuesCache.remove({userId: userId,}); 		 */
		}
		return venues;		
	},
	
	removevenuesFsqr: function(){
		VenuesCache.remove({});
	},
});

