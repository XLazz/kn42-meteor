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

	'checkinsFsqr': function(userId){
		var fsqrToken = fsqrApi(userId);
		var limit = 200;
		if (CheckinsFsqr.findOne())
			limit = 1;
		console.log('checkins Fsqr userId ', userId, fsqrToken );	
		if (!fsqrToken){
			console.error('no Fsqr token or query ');
			return;
		}
		var checkins = GetFsqrChk (limit);
		if (!checkins)
			return;

		checkins = checkins.response.checkins.items;
		console.log('checkins Fsqr http call 1 update ', userId );
		var place = {};
		var earliestUserPlace = UserPlaces.findOne({userId: userId},{sort:{timestamp:1}});
			
		if (checkins.length !== 0) {
			var i = 0
			console.log('checkins Fsqr http call 2 update ', userId, ' # of results', checkins.length );
			checkins.forEach(function (item, index, array) {
				i++;
				item.updated = moment().valueOf();
				item.userId = userId;
				item.itemI = i;
				console.log('checkins Fsqr http call 3 update item ', i );
				CheckinsFsqr.upsert({id:item.id}, item)
/* 				if (earliestUserPlace ){ */
					if (item.venue){
						place.foursquareId = item.id;
						place.userId = userId;
						place.timestamp = 1000*(item.createdAt);
						place.timestampEnd = 1000*(item.createdAt);
						place.location = {coords:{latitude: item.venue.location.lat, longitude: item.venue.location.lng}};
						place.started = moment(place.timestamp).format("YYYY-MM-DD HH:mm:ss");
						place.confirmed = true;
						UserPlaces.upsert({foursquareId: place.foursquareId}, place);
					}
/* 				}		 */		
			});
		} else {
			console.log('checkins empty ', userId, ' # of results', checkins.length, ' url ', url  );
/* 			VenuesCache.remove({userId: userId,}); 		 */
		}
		return checkins;		
	},
	
	
	removevenuesFsqr: function(){
		VenuesCache.remove({});
		CheckinsFsqr.remove({});
	},
});

