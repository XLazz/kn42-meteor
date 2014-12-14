CreateProfile = function(userId){
	user_details = Meteor.users.findOne(userId);
	if (!user_details) {
		return;
	}
	if ((!user_details.profile.name) || (!user_details.profile.picture)){
			create_profile = 1;
			console.log('create_profile 1 ', Meteor.user());
	}
	if ((user_details.profile.foursquare) && (!user_details.profile.foursquareId)){
			create_profile = 1;
			console.log('create_profile foursquare ', Meteor.user());
	}
	if ((create_profile) && (user_details)) {
		console.log('user_details ', user_details);
	
		Session.set('profileCall', true);
		Meteor.call('updateProfile', Meteor.userId(), function(err, results){
			user_details = Meteor.user();
			Session.set('profileCall', false);
		});
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

