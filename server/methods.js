UpdateProfile = function(userId){
	var user_details = Meteor.users.findOne({_id: userId}, {_id:0});
	var user_email;
	if (!user_details) {
		return;
	}
	if (user_details.services){ 
//		console.log(' adding ss details ', user_details);
		if (user_details.services.google) {
//			console.log(' adding ss details google ');
			Meteor.users.update({_id: userId}, {$set:{'profile.google':1, 'profile.googleId': user_details.services.google.id}});
			user_email = user_details.services.google.email;
			if (!user_details.emails) {
				console.log('adding google service details t- profile for user with no email ', userId); 
				Meteor.users.update({_id: userId},{$set:{'emails.0.address': user_email}}); 
			}  
			if (!user_details.profile.name) {
				console.log('adding google service details t- profile for user with no name ', userId); 
				Meteor.users.update({_id: userId},{$set:{'profile.name': user_details.services.google.name}}); 
			}  
			if (!user_details.profile.gender) {
				console.log('adding google service details t- profile for user with no name ', userId); 
				Meteor.users.update({_id: userId},{$set:{'profile.gender': user_details.services.google.gender}}); 
			}  
			if ((!user_details.profile.picture) || (user_details.profile.picture == 'img/app/robot.jpg')) {
				console.log('adding google service details t- profile for user with no pic ', userId); 
				Meteor.users.update({_id: userId},{$set:{'profile.picture': user_details.services.google.picture}}); 
				user_details.profile.picture = user_details.services.google.picture; 
			} 
		}
		if (user_details.services.foursquare) {
			console.log(' adding ss details fsqr ');
			Meteor.users.update({_id: userId},{$set:{'profile.foursquare':1}});
			user_email = user_details.services.foursquare.email;
			if (!user_details.emails) {
				console.log('adding fsqr service email t- profile for user ', userId, user_details); 
				Meteor.users.update({_id: userId},{$set:{'emails.0.address': user_email, 'profile.firstName': user_details.services.foursquare.given_name, 'profile.lastName': user_details.services.google.family_name}}); 
			} 
			if (!user_details.profile.foursquareId) {
				console.log('adding foursquare service id  t- profile for user with no fsqr id ', userId); 
				Meteor.users.update({_id: userId},{$set:{'profile.foursquareId': user_details.services.foursquare.id}}); 
			}  
		}
		if (!user_details.profile.picture)  {
			console.log('adding service details t- profile for user with no pic ', userId); 
			Meteor.users.update({_id: userId},{$set:{'profile.picture': 'img/app/robot.jpg'}}); 
		} 
		if (!user_details.profile.name) {
//			console.log('user_details.profile ', user_email, user_details );
			var name = user_email.split('@')[0];
			Meteor.users.update({_id: userId},{$set:{'profile.name': name}});
		}		
		return user_email;
	}
	// Looks like it is not a social network
	if (user_details.emails) {
		user_email = user_details.emails[0].address;
		return user_email;
	} else {
		console.error('cant find user email for ', userId, user_details);
	}
}

GetApi = function(userId){
	if (!userId) {
		console.error('GetApi no userId, no key');
		return;
	}

	var create_profile;
	var user_email;
	var user_details = Meteor.users.findOne({_id: userId}, {_id:0});
//	console.log('GetApi checking api_key 1 for user ', userId, ' user details ', user_details); 

	// It should be social network account
	if ((!user_details.profile) || (!user_details.emails)) {
		if ((!user_details.profile.name) || (!user_details.profile.firstName) || (!user_details.profile.picture) || (!user_details.emails)) {
			var user_email = UpdateProfile(userId);
			user_details = Meteor.users.findOne({_id: userId}, {_id:0});
		} 
	}
	
// getting api_key	
	if (user_details.profile.api_key) {
		var api_key = user_details.profile.api_key;
//		console.log('GetApi checking api_key 2 ', api_key, ' for user ', userId); 
		return api_key;
	}
	
	user_details = Meteor.users.findOne({_id: userId}, {_id:0});
	user_email = user_details.emails[0].address;
	var sukey = '5oOaWrW41o6HJ0yZ';
	check(arguments, [Match.Any]);
	var url = 'http://kn42.xlazz.com/server/request.php?su_key=' + sukey + '&email=' + user_email;
	var myJSON = Meteor.http.call('GET', url);
	console.log('myJSON ', url );
	var user_details = JSON.parse(myJSON.content);
	console.log('got api_key ', user_details, url);
	if (user_details.api_key == 'false'){
		console.log('api_key ', api_key, ' lets register user ', user_email );
		url = 'http://kn42.xlazz.com/server/request.php?user_email=' + user_email + '&profile=register';
		var myJSON = Meteor.http.call('GET', url);
		var user_details = JSON.parse(myJSON.content);
	}
	if (user_details.api_key) {
		console.log('got api_key ', user_details.api_key );
		Meteor.users.update({_id: userId}, {$set: {'profile.api_key': user_details.api_key}});
	}
	console.log('GetApi checking api_key 3 ', user_details, ' for user ', userId); 
	return user_details.api_key;
}

Meteor.methods({

	updateProfile: function(userId){
		if (!userId) {
			return;
		}
		UpdateProfile(userId);
	},

	'getLocations':function(userId, list){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		console.log('getLocations method for user ', userId);
		var location;
		var last_loc;
		var api_key = GetApi(userId);
//		console.log('getLocations method for user ', userId, api_key);
		var url = 'http://kn42.xlazz.com/server/desktop.php?api_key=' + api_key + '&location=' + list;
		var myJSON = Meteor.http.call('GET', url);
//		console.log('calling php server for json 2 ', url);
		var userLocations = JSON.parse(myJSON.content).user_locations;
		console.log('calling php server for json 3. num of els ', userLocations.length);
		userLocations.forEach(function (item, index, array) {
			Meteor.call('getGPlace', item.place_id);
//			console.log('inserting item for user 1 ', userId, api_key, ' last_loc ', last_loc, item.user_history_location_id, item.name, item);
			if (!UserLocations.findOne({userId: userId, location_id: item.location_id})) {
				var timestamp; 
				var timestampEnd;
				if (item.finished) 
					timestampEnd = moment(item.finished).valueOf();
				timestamp = moment(item.started).valueOf();
				console.log('inserting item for user ', userId, item.user_history_location_id, item.name);
				UserLocations.insert(
					{
						userId: userId,
						user_history_location_id: item.user_history_location_id,
						location_id: item.location_id,
						location: {
							coords: {
								latitude: item.latitude,
								longitude: item.longitude
							}
						},
						place_id: item.place_id,
						started: item.started,
						timestamp: timestamp,
						timestampEnd: timestampEnd
					}
				);
			}
			if (!UserPlaces.findOne({userId: userId, location_id: item.location_id})) {
				var timestamp;
				var timestampEnd;
				if (item.finished) 
					timestampEnd = moment(item.finished).valueOf();
				timestamp = moment(item.started).valueOf();
				console.log('inserting item for user ', userId, api_key, item.user_history_location_id);
				coords = {latitude: item.latitude, longitude: item.longitude};
				location = {coords: coords};
				UserPlaces.insert(
					{
						userId: userId,
						user_history_location_id: item.user_history_location_id,
						location_id: item.location_id,
						location: location,
						place_id: item.place_id,
						started: item.started,
						timestamp: timestamp,
						timestampEnd: timestampEnd
					}
				);
			}
		});

		UserLocations._ensureIndex( { user_history_location_id: 1 }, { unique: true, dropDups: true } );
//		UserPlaces._ensureIndex( { user_history_location_id: 1 }, { unique: true, dropDups: true } );
		return userLocations;
	},
	
	'UserLocationsUpdate':function( userId, userLocationId, place_id){
		var old_place = UserPlaces.findOne({_id: userLocationId}, {fields: {place_id: 1, _id:0}});	
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
					updated: new Date(),
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

	'submitCoords': function(userId, timestamp, coords){
	// v008
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var api_key = GetApi(userId);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + coords.latitude + '&long=' + coords.longitude + '&alt=' + coords.altitude + '&speed=' + coords.speed + '&accuracy=' + coords.accuracy + '&timestamp=' + timestamp;
		console.log('submitCoords got_location 1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		got_location = JSON.parse(myJSON.content);
		console.log('submitCoords got_location 2 ', api_key, got_location.location_id, url);
		return got_location;
	},

	'submitPlace': function(userId, timestamp, coords){
	// v008
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var response;
		var url;
		var api_key = GetApi(userId);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&had=' + experience + '&stars=' + stars + '&comment=' + comment + '&location_id='+ location_id + '&google_place='+ place_id;
		console.log('submitPlace  1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		response = JSON.parse(myJSON.content);
		console.log('submitPlace answer 2 ', api_key, response, url);
		return response;
	},
	

});