var ifUpdating;
Meteor.methods({

	updateProfile: function(userId){
		var user_details = Meteor.users.findOne(userId);
		console.log('updateProfile ', userId , user_details);
		if (!user_details) {
			return;
		}
		if (!user_details.emails) {
			console.log('no standard email, getting it from services for ', userId);
			var update = {};
			update.emails = [];
			update.emails[0] = {};
			update.emails[0].address = user_details.services.google.email;
			Meteor.users.upsert({_id:userId}, {$set: update});
			//		Meteor.users.upsert(userId, {$set: user_details});
		}
		
		if ((!user_details.profile.picture) || (user_details.profile.picture == 'img/app/robot.jpg')) {
			console.log('no pic, getting it from services for ', userId);
			var picture;
			if (user_details.services.google.picture) {
				picture = user_details.services.google.picture;
			} else {
				if (user_details.profile.picture != 'img/app/robot.jpg')
				picture = 'img/app/robot.jpg';
			}
			if (picture)
				Meteor.users.update(userId, {$set: {'profile.picture': picture}});
		}
		return Meteor.users.findOne(userId);
	},

	updatePlaces: function(userId, ifDebug){
			
		// 1st check with no place_id
		if (moment().valueOf() < ifUpdating + 60000) {
			console.log('ifUpdating in progress, exiting ', ifUpdating);
			return;
		}
		ifUpdating = moment().valueOf();
		console.log('empty places', UserPlaces.find({place_id: {$exists: false}}).count(), 'filled', UserPlaces.find({place_id: {$exists: true}}).count());
		
		var userPlaces = UserPlaces.find({userId: userId, place_id: {$exists: false}}, {limit: 50, sort:{timestamp: -1}	}	);
		if (!userPlaces.count()) {
			userPlaces = 'all filled up';
			ifUpdating = false;
			return userPlaces;
		}
		if (ifDebug)
			console.log('userPlaces with empty place_id. userId: ', userId, ' these many ',  userPlaces.count());
		userPlaces = userPlaces.fetch();
		var radius = 50;
//		response = GetGoogleLoc(userId,  userPlaces.fetch()[0].location.coords, radius, name);
//		console.log('userPlaces  ', response);
		var i = 0;
		var name = '';
		var place;
		if (!userPlaces) 
			return;
		userPlaces.forEach(function (item, index, array) {
			// console.log('');
			// if  (ifDebug)
				// console.log('updatePlaces calling GetGoogleLoc 1 item#', i++, userId, item.location.coords, radius, ifDebug);
			var response = GetGoogleLoc(userId, item.location.coords, radius, name, ifDebug);
			if  (ifDebug)
				console.log('updatePlaces calling GetGoogleLoc 2 item#', i,  'for item ', item._id, 'place_id', item.place_id, '# of google responses', response.results.length);
			if (response.results.length == 0)
				return;
			response.results.forEach(function (item, index, array) {
				var ifAuto = AutoPlaces.findOne({userId:userId, place_id:item.place_id});
				if (ifAuto) {
					if (ifDebug)
						console.log('userPlaces 0.5 ifAuto ', item.place_id, item.name);
					place = item;
					return place;
				}
			});
			if  (ifDebug)
				if (place)
					console.log('userPlaces 0.6 ', item._id, item.started, place.name, place.place_id);
			if (!place) {
				if ((response.results) && (item._id)) {
					if (response.results[1]) {
						place = response.results[1];
						if (ifDebug)
							console.log('userPlaces 1 ', item._id, item.started, place.name, place.place_id);
					} else {
						place = response.results[0];
						if (ifDebug)
							console.log('userPlaces 2 ', item._id, item.started, place.name, place.place_id);
					}
				}
			}
			place.updated = moment().valueOf();
			UserPlaces.update(item._id, {$set: {place_id: place.place_id}});
			if (!Places.findOne({place_id: place.place_id}))
				Places.insert(place);
			
		});
		ifUpdating = false;
			//		Meteor.users.upsert(userId, {$set: user_details});
		
	},

	updatePlaceNames: function(userId, ifDebug){
		
		return; //doesnt work yet
		// 1st check with no place_id
		if (ifUpdating)
			return;
		ifUpdating = true;
		console.log('empty places', UserPlaces.find({place_id: {$exists: false}}).count(), 'filled', UserPlaces.find({place_id: {$exists: true}}).count());
		
		var userPlaces = UserPlaces.find({userId: userId, place_id: {$exists: false}}, {limit: 50, sort:{timestamp: -1}	}	);
		if (!userPlaces) {
			userPlaces = 'all filled up';
			return userPlaces;
		}
		if (ifDebug)
		console.log('userPlaces with empty place_id. userId: ', userId, ' these many ',  userPlaces.count());
		userPlaces = userPlaces.fetch();
		var radius = 50;
		//		response = GetGoogleLoc(userId,  userPlaces.fetch()[0].location.coords, radius, name);
		//		console.log('userPlaces  ', response);
		var i = 0;
		var name = '';
		userPlaces.forEach(function (item, index, array) {
			console.log('');
			if  (ifDebug)
			console.log('updatePlaces calling GetGoogleLoc 1 item#', i++, userId, item.location.coords, radius, ifDebug);
			var response = GetGoogleLoc(userId, item.location.coords, radius, name, ifDebug);
			if  (ifDebug)
			console.log('updatePlaces calling GetGoogleLoc 2 item#', i,  'for item ', item._id, 'place_id', item.place_id, '# of google responses', response.results.length);
			if (response.results.length == 0)
			return;
			var place = response.results.forEach(function (item, index, array) {
				var ifAuto = AutoPlaces.findOne({userId:userId, place_id:item.place_id});
				if (ifAuto) {
					if (ifDebug)
					console.log('userPlaces 0.5 ifAuto ', item.place_id, item.name);
					return item;
				}
			});
			if  (ifDebug)
			if (place)
			console.log('userPlaces 0.6 ', item._id, item.started, place.name, place.place_id);
			if (!place) {
				if ((response.results) && (item._id)) {
					if (response.results[1]) {
						place = response.results[1];
						if (ifDebug)
						console.log('userPlaces 1 ', item._id, item.started, place.name, place.place_id);
					} else {
						place = response.results[0];
						if (ifDebug)
						console.log('userPlaces 2 ', item._id, item.started, place.name, place.place_id);
					}
				}
				place.updated = moment().valueOf();
				UserPlaces.update(item._id, {$set: {place_id: place.place_id}});
				if (!Places.findOne({place_id: place.place_id}))
				Places.insert(place);
			}
		});
		ifUpdating = false;
		//		Meteor.users.upsert(userId, {$set: user_details});
		
	},
	
	'updatePlace': function(userId, location, experience){
		// v008
		if ((!userId) || (!location))  {
			console.error('updatePlace and no location');
			return;
		}
		if ((!location.location_id) && (!location.userplaceId)){
			console.error('updatePlace and no location_id ', location);
			return;
		}		
		check(arguments, [Match.Any]);
		var place = UserPlaces.findOne(location.userplaceId);
		var api_key = GetApi(userId);
		//		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&had=' + had + '&stars=' + stars + '&comment=' + comment + '&location_id='+ location.location_id + '&google_place='+ place_id;
		if (place) {
			var url = 'http://kn42.xlazz.com/server/request.php?api_key=' +api_key +'&location=update&location_id='+ location.location_id + '&google_place=' +location.place_id + '&userplaceId=' + location.userplaceId + '&status=' +location.status +'&timestamp=' +place.timestamp+ '&timestampEnd=' +place.timestampEnd;
		} else {
			var url = 'http://kn42.xlazz.com/server/request.php?api_key=' +api_key +'&location=update&location_id='+ location.location_id + '&google_place=' +location.place_id + '&userplaceId=' + location.userplaceId + '&status=' +location.status ;
		}
		console.log('submitPlace  1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		console.log('submitPlace ', myJSON.content);
		var response = JSON.parse(myJSON.content);
		console.log('updatePlace answer 2 ', api_key, url, response );
		return response;
	},
	
/* 	'getLocations':function(userId, list){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		console.log('getLocations method for user ', userId);
		var location,	confirmed, travel, last_loc, timestamp, timestampEnd;
		var api_key = GetApi(userId);
//		console.log('getLocations method for user ', userId, api_key);
		var url = 'http://kn42.xlazz.com/server/desktop.php?api_key=' + api_key + '&location=' + list;
		var myJSON = Meteor.http.call('GET', url);
//		console.log('calling php server for json 2 ', url);
		var userLocations = JSON.parse(myJSON.content).user_locations;
		console.log('calling php server for json 3. num of els ', userLocations.length);
		userLocations.forEach(function (item, index, array) {
			var ifPlace = UserPlaces.findOne({				
				$and: [
					{location_id: item.location_id}, {userId: userId}, {
						$or: [
							{userplaceId: item.userplaceId}, {userplaceId: ''}
						]
					} 
				]
			});
			var lastUserPlace = UserPlaces.findOne({userId:userId},{sort:{timestamp: -1}});
			if ((!ifPlace) && (lastUserPlace.place_id != item.place_id)) {
				if (item.finished) 
					timestampEnd = moment(item.finished).valueOf();
				timestamp = moment(item.started).valueOf();
				console.log('inserting item for user ', userId, api_key, item.user_history_location_id);
				coords = {latitude: item.latitude, longitude: item.longitude};
				location = {coords: coords};
				if (item.status == 'congfirmed')
					status = 'confirmed';
				if (item.status == 'travel')
					status = 'travel';	
				if (item.userplaceId) {
					UserPlaces.upsert(
						item.userplaceId,
						{
							_id: item.userplaceId,
							userId: userId,
							user_history_location_id: item.user_history_location_id,
							location_id: item.location_id,
							location: location,
							place_id: item.place_id,
							started: item.started,
							timestamp: timestamp,
							timestampEnd: timestampEnd,
							status: status
						}
					);
				} else {
					if (item.user_history_location_id)
						UserPlaces.upsert(
							{user_history_location_id: item.user_history_location_id},
							{
								userId: userId,
								user_history_location_id: item.user_history_location_id,
								location_id: item.location_id,
								location: location,
								place_id: item.place_id,
								started: item.started,
								timestamp: timestamp,
								timestampEnd: timestampEnd,
								status: status
							}
						);				
				}
			}
		});

		return userLocations;
	}, */
	
	'UserLocationsUpdate':function( userId, userPlaceId, place_id){
		var old_place = UserPlaces.findOne(userPlaceId, {fields: {place_id: 1, _id:0}});	
		var found = UserPlaces.find({userId: userId, place_id: old_place.place_id}).fetch();	
		UserPlaces.update({userId: userId, place_id: old_place.place_id}, {$set: {place_id: place_id}}, {multi:true});	

		console.log('updated UserLocations for all ', userId, ' old place ', old_place.place_id, ' new place ', place_id);
		return found;
	},
	
	getPlaces: function(userId, userLocation, radius, elsewhere ){
		if (!userLocation)
			return;
		if (!radius)
			var radius = 50;
		check(arguments, [Match.Any]);

		if (!elsewhere) {
			if (MerchantsCache.findOne({lat: userLocation.latitude, lng: userLocation.longitude})) {
	//			console.log ('request 1 ', userLocation.user_history_location_id, userLocation.place_id);
				if (MerchantsCache.findOne({lat: userLocation.latitude, lng: userLocation.longitude}).name) {
	//			console.log ('already got places for the ', userLocation.user_history_location_id);
					return MerchantsCache.findOne({lat: userLocation.latitude, lng: userLocation.longitude}).name;
				} else {
					var fromNow = moment().valueOf() - moment(MerchantsCache.findOne({lat: userLocation.latitude, lng: userLocation.longitude}).updated).valueOf();
					
					if (fromNow < 30000) {
	//					console.log ('request too recent, ski[[ong ', userLocation.user_history_location_id, userLocation.place_id);
						return;
					} else {
						gotPlaces = MerchantsCache.remove({lat: userLocation.latitude, lng: userLocation.longitude, place_id: {$exists: false }});
						console.log ('request 1a ', userLocation.user_history_location_id, userLocation.place_id, fromNow, MerchantsCache.findOne({lat: userLocation.latitude, lng: userLocation.longitude}));
					}
				}
				
			} 
			
			MerchantsCache.upsert(
				{
					lat: userLocation.latitude,
					lng: userLocation.longitude,
				},
				{$set:{
					lat: userLocation.latitude,
					lng: userLocation.longitude,
					user_history_location_id: userLocation.user_history_location_id,
					updated: moment().valueOf()
				}}
			);
		}
				
		var api_key = GetApi(userId);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=places&lat=' + userLocation.latitude + '&long=' + userLocation.longitude + '&radius=' + radius;
		console.log('calling php on server for lat and lng radius', userId, userLocation.user_history_location_id , userLocation.place_id, radius, url);
		var myJSON = Meteor.http.call('GET', url );
			
		myMerchants = JSON.parse(myJSON.content);
		myMerchants = myMerchants.google_places.results;
		console.log('calling php on server for lat and lng radius 2 ', userId);
		if (!myMerchants) {
			console.log('calling php on server for lat and lng radius 2a ', userId);	
			return myMerchants;
		}
		if (!myMerchants[0]) {
			console.log('calling php on server for lat and lng radius 2b ', userId);	
			return myMerchants;
		}
		userLocation = UserLocations.findOne({user_history_location_id: userLocation.user_history_location_id});
		console.log('calling php on server for lat and lng radius 3 ', userId, userLocation.user_history_location_id);			
		if (!userLocation.name) {
			if (myMerchants[0].name) {
				name = myMerchants[0].name;
			} else if (myMerchants[1].name) {
				name = myMerchants[1].name;
			}			
			console.log('updating userLocation with name ', name);
		}

		console.log('calling php on server for lat and lng radius 4 ', userId);			
		return myMerchants;
/* 		if (myMerchants[0]) {
			if (myMerchants[0].name) {
				console.log('calling php on server for lat and lng radius 4b ', userId);			
				return myMerchants[0];
			} else {
				console.log('calling php on server for lat and lng radius 4c ', userId);			
				return myMerchants[1];
			}
		} */
	},
	 
	'removeAllPlaces': function(userId) {
		if (!userId) {
			return;
		}
		return Places.remove({});	
	},
	
	'removeAllLocations': function(userId) {
		check(arguments, [Match.Any]);
		if (!userId) {
			return;
		}
		console.log('removing all locations ');
		MerchantsCache.remove({});
		Places.remove({});	
		UserPlaces.remove({userId: userId});
/* 		VenuesFsqr.remove();
		VenuesCheckins.remove(); */
		return UserLocations.remove({userId: userId});
	},	
	
	'deleteGeoData': function(userId) {
		check(arguments, [Match.Any]);
		if (!userId) {
			return;
		}
		console.log('removing all geodata ');
		GeoLog.remove({userId:userId});
		GooglePlaces.remove({});
	},
	
	'showProfile': function(userId) {	
	// Checking if we have google user with the same email
//		var user = Meteor.users.findOne({_id: userId});
		var user = Meteor.users.find({}).fetch();
		var config = ServiceConfiguration.configurations.find().fetch();
		console.log(userId, user);
		return {user: user, config: config};
	},
	
	'uploadCoords': function(userId, api_key){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var coords = GeoLog.find({userId: userId}, {sort: {created: -1}, limit: 10}).fetch();
//		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + lat + '&long=' + lng + '&alt=' + alt + '&speed=' + speed + '&timestamp=' + timestamp;
//		var myJSON = Meteor.http.call('GET',url);
//		got_location = JSON.parse(myJSON.content);
		console.log('uploadCoords got_location ', api_key, coords, got_location, url);
		return coords;
	},

	'submitCoords': function(userId, geoId, location){
	// v008
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var api_key = GetApi(userId);
		console.log('submitCoords ', location);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + location.coords.latitude + '&long=' + location.coords.longitude + '&alt=' + location.coords.altitude + '&speed=' + location.coords.speed + '&accuracy=' + location.coords.accuracy + '&timestamp=' + location.timestamp + '&heading=' + location.coords.heading + '&locationId=' + geoId;
		console.log('submitCoords got_location 1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		got_location = JSON.parse(myJSON.content);
		console.log('submitCoords got_location 2 ', api_key, got_location.location_id, url);
		GeoLog.upsert(
			geoId,
			{$set: {location_id: got_location.location_id}}
		);
		Meteor.call('updatePlaces', userId);
		return got_location;
	},

	'submitPlace': function(userId, location, experience){
	// v008
		if ((!userId) || (!location))  {
			console.error('submitPlace and no location');
			return;
		}
		if ((!location.location_id) && (!location.userplaceId)) {
			console.error('submitPlace and no location_id ', location);
			return;
		}		
		var userplaceId = location.userplaceId;

		var place_id = location.place_id;
		check(arguments, [Match.Any]);
		var response;
		var url;
		var api_key = GetApi(userId);
//		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&had=' + had + '&stars=' + stars + '&comment=' + comment + '&location_id='+ location.location_id + '&google_place='+ place_id;
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' +api_key +'&location=add&location_id='+ location.location_id + '&google_place=' +place_id + '&userplaceId=' + userplaceId;
		console.log('submitPlace  1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		console.log('submitPlace ', myJSON.content);
		response = JSON.parse(myJSON.content);
		console.log('submitPlace answer 2 ', api_key, url, response );
		return response;
	},

	sendEmail: function(doc) {
		// Important server-side check for security and data integrity
		check(doc, Schemas.contact);
		
		// Build the e-mail text
		var text = "Name: " + doc.name + "\n\n"
		+ "Email: " + doc.email + "\n\n\n\n"
		+ doc.message;
		
		this.unblock();
		
		// Send the e-mail
		Email.send({
			to: "stanp@xlazz.com",
			from: doc.email,
			subject: "Website Contact Form - Message From " + doc.name,
			text: text
		});
	}	
});