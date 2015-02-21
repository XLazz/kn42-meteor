Meteor.methods({

	updateProfile: function(userId){
		var user_details = Meteor.users.findOne(userId);
		var user_email;
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
	},

	updatePlaces: function(userId){
			
		// 1st check with no place_id
		var userPlaces = UserPlaces.find({userId: userId, place_id: {$exists: false}}, {limit: 200, sort:{timestamp: -1}});
		if (!userPlaces) 
			return;
		console.log();
		console.log('userPlaces with empty place_id. userId: ', userId, ' these many ',  userPlaces.count());
		userPlaces = userPlaces.fetch();
		var radius = 50;
		var name = '';
//		response = GetGoogleLoc(userId,  userPlaces.fetch()[0].location.coords, radius, name);
//		console.log('userPlaces  ', response);
		userPlaces.forEach(function (item, index, array) {
			var response = GetGoogleLoc(userId, item.location.coords, radius, name);
			
			if (response.results)
				if (response.results[1]) {
					console.log('userPlaces  ', item._id, item.started, response.results[1].name, response.results[1].place_id);
					UserPlaces.upsert(item._id, {$set: {place_id: response.results[1].place_id}});
					Places.upsert({place_id: response.results[1].place_id},{$set: response.results[1]});
				} else {
					console.log('userPlaces  ', item._id, item.started, response.results[0].name, response.results[0].place_id);
					UserPlaces.upsert(item._id, {$set: {place_id: response.results[0].place_id}});
					Places.upsert({place_id: response.results[0].place_id},{$set: response.results[0]});
				}
		});
			//		Meteor.users.upsert(userId, {$set: user_details});
		
	},
	
	'getLocations':function(userId, list){
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
/* 			Meteor.call('getGPlace', item.place_id, function(err, results){
			}); */

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

		UserLocations._ensureIndex( { user_history_location_id: 1 }, { unique: true, dropDups: true } );
		PlaceServices._ensureIndex( { types: 1 }, { unique: true, dropDups: true } );
//		UserPlaces._ensureIndex( { user_history_location_id: 1 }, { unique: true, dropDups: true } );
		return userLocations;
	},
	
	'UserLocationsUpdate':function( userId, userPlaceId, place_id){
		var old_place = UserPlaces.findOne(userPlaceId, {fields: {place_id: 1, _id:0}});	
		var found = UserPlaces.find({userId: userId, place_id: old_place.place_id}).fetch();	
		UserPlaces.update({userId: userId, place_id: old_place.place_id}, {$set: {place_id: place_id}}, {multi:true});	

		console.log('updated UserLocations for all ', userId, ' old place ', old_place.place_id, ' new place ', place_id);
		return found;
	},
	
	'getPlaces': function(userId, userLocation, radius, elsewhere ){
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