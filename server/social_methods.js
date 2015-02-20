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
		var limit = 20;
		if ((!fsqrToken) && (!query)){
			console.error('no Fsqr token or query ');
			return;
		}
		var venues = GetFsqrLoc (coords, limit, query);
		if (!venues)
			return;
		venues = venues.response.venues;
		
		if (venues.length !== 0) {
			var i = 0;
			console.log('venues Fsqr http call 2 update ', coords, ' # of results', venues.length  );
			venues.forEach(function (item, index, array) {
				if (item.stats.usersCount > 10) {
					item.updated = moment().valueOf();
					console.log ('venues Fsqr http call 2 update ', i++, coords, ' # of results', item );
					item.location.lat = parseFloat(item.location.lat);
					item.location.lng = parseFloat(item.location.lng);
					VenuesCache.upsert({id: item.id}, {$set: {'id': item.id, 'name':item.name, 'location':item.location, 'updated': item.updated, 'stats': item.stats }});
				}
			});
		} else {
			console.log('venues empty ', coords, ' # of results', venues.length );
/* 			VenuesCache.remove({userId: userId,}); 		 */
		}
		return venues;		
	},

	'goFsqr': function(userId, userPlaceId, venueId){
		console.log('goFsqr 0 ', userId, venueId );
		var fsqrToken = fsqrApi(userId);
		console.log('goFsqr 1 ', userId, fsqrToken, venueId );
		if (!fsqrToken) {
			console.error('goFsqr no Fsqr token  ');
			return;
		}
		// adding fsqr checkin
		var venue = CheckInFsqr (venueId);
		console.log('goFsqr checkin venue  ', userPlaceId, venueId, venue, venue.response.checkin.id );
		if (!venue)
			return;
		VenuesCheckins.upsert({id:venue.response.checkin.id}, {$set:{userId: userId, checkinId: venue.response.checkin.id, createdAt: venue.response.checkin.createdAt, venueId: venue.response.checkin.venue.id, }});
		VenuesFsqr.upsert({id:venue.response.checkin.venue.id}, venue.response.checkin.venue);
		if (userPlaceId)
			UserPlaces.upsert(userPlaceId, {$set:{foursquareChk: venue.response.checkin.id}});
		return venue;		
	},
	
	'checkinsFsqr': function(userId, userPlaceId){
		var response;
		var fsqrToken = fsqrApi(userId);
		var limit = 2;
		if (!VenuesCheckins.findOne())
			limit = 200;
		console.log('checkins Fsqr userId ', userId, fsqrToken );	
		if (!fsqrToken){
			console.error('no Fsqr token or query ');
			return;
		}
		var checkins = GetFsqrChk (limit);
		if (!checkins)
			return;

		console.log('checkins Fsqr http call 1 update ', userId);
//		checkins = checkins.response.checkins.items;
		
		var place = {};
			
		if (checkins.response.checkins.count !== 0) {
			var earliestUserPlace = UserPlaces.findOne({userId:userId}, {sort: {timestamp: 1}});
			if (!earliestUserPlace)
				return;
			var i = 0
			console.log('checkins Fsqr http call 2 update ', userId, ' # of results', checkins.response.checkins.items.length, checkins.response.checkins.count, ' earliest ', earliestUserPlace.timestamp, earliestUserPlace.started );
			var items = checkins.response.checkins.items;
			items.forEach(function (item, index, array) {
				i++;
				item.updated = moment().valueOf();
				item.userId = userId;
				item.itemI = i;
				item.date = moment(item.createdAt*1000).format("MM/DD/YY HH:mm");
				
				if (!item.venue) {
					console.error(' empty item checkins Fsqr http call 3 ', item);
				} else {
					VenuesCheckins.upsert({id: item.id}, {$set:{userId: userId, venueId: item.venue.id, id: item.id, createdAt: item.createdAt, date: item.date}});
					VenuesFsqr.upsert({id:item.venue.id}, {$set: {'id': item.venue.id, 'name':item.venue.name, 'contact': item.venue.contact, 'location':item.venue.location }});
					var userPlace = UserPlaces.findOne({userId: userId, timestampEnd: { $gte: 1000*item.createdAt}, timestamp: {$lte: 1000*item.createdAt}});
//					var userPlace2 = UserPlaces.findOne({userId: userId, timestamp: { $gte: 1000*item.createdAt-1}, timestampEnd: {$lte: 1000*item.createdAt+1}});
//					console.log('checkins Fsqr http call 3 update item ', i, ' checkin ', item.id, 'createdAt ', item.date, ' venue ', item.venue.id, item.venue.name );
					if (!userPlace) {
						if (item.venue){
							
							place.foursquareChk = item.id;
							place.userId = userId;
							place.timestamp = 1000*(item.createdAt);
							place.timestampEnd = 1000*(item.createdAt)+60000;
							place.location = {coords:{latitude: item.venue.location.lat, longitude: item.venue.location.lng}};
							place.started = moment(place.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
							place.confirmed = 'confirmed';	
							var name = item.venue.name.split(" ");
							if (name[0] == 'The') {
								name = name[1];
							} else {
								name = name[0];
							}
							name = '';
							console.log('checkins Fsqr http call 4 adding item to UserPlaces ', i, item.id, item.venue.name, place.timestamp, place.started  );
							var userPlaceId = UserPlaces.insert(place);
//							var response = GetGoogleLoc(userId, place.location.coords, 100,  name);
							if (response) {
								if (response.results.length) {				
									place.geo_place_id = response.results[0].place_id;
									if (response.results[1]) 
										place.place_id = response.results[1].place_id;
									
								}
							}
						}
					} else {
						console.log('checkins Fsqr http call 4.5 upserting item to UserPlaces ', userPlace._id, ' number ', i, ' item ', item.id, item.venue.name );
//						var userPlace = UserPlaces.findOne({userId: userId, timestamp: { $gt: 1000*item.createdAt}, timestampEnd: {$lt: 1000*item.createdAt}});
						UserPlaces.upsert(userPlace._id, {$set:{foursquareChk: item.id, confirmed: true, started: item.date}});
					}
				}	
			});
		} else {
			console.log('checkins empty ', userId, ' # of results', checkins.length, ' url ', url  );
/* 			VenuesCache.remove({userId: userId,}); 		 */
		}
		return checkins;		
	},
	
	
	removevenuesFsqr: function(){
		VenuesCache.remove({});
		VenuesCheckins.remove({});
		VenuesFsqr.remove({});
	},
});

