GetFsqr = function(userId){
	if (!userId) {
		console.error('FsqrApi no userId, no key');
		return;
	}
	var fsqrOauth = Meteor.users.findOne({_id: userId}, {'user_details.services.foursquare.accessToken': 1, _id:0});
	return fsqrOauth; 
}

GetApi = function(userId){
	if (!userId) {
		console.error('GetApi no userId, no key');
		return;
	}

	var create_profile;
	var user_details = Meteor.users.findOne({_id: userId}, {_id:0});
//	console.log('GetApi checking api_key 1 for user ', userId, ' user details ', user_details); 
	if (user_details.emails) {
		var user_email = user_details.emails[0].address;
		if (!user_details.profile) {
			create_profile = 1;
		} else {
			if (!user_details.profile.firstName){
				create_profile = 1;
			}
		}
		if ((create_profile) && (user_details)) {
//			console.log('user_details.profile ', user_email, user_details );
			var name = user_email.split('@')[0];
			Meteor.users.update({_id: userId},{$set:{'profile.firstName': name, 'profile.lastName': ' ', 'profile.picture': "img/app/robot.jpg"}});
		}				
	} 
	// It should be social network account
	if (user_details.services){ 
		console.log(' adding ss details ', user_details.services);
		if (user_details.services.google) {
			Meteor.users.update({_id: userId}, {$set:{'profile.google':1}});
			var user_email = user_details.services.google.email;
			if (!user_details.emails) {
				console.log('adding service details t- profile for user ', userId, user_details); 
				Meteor.users.update({_id: userId},{$set:{'emails.0.address': user_email, 'profile.firstName': user_details.services.google.given_name, 'profile.lastName': user_details.services.google.family_name}}); 
			} else if ((!user_details.profile.picture) || (user_details.profile.picture == 'img/app/robot.jpg')) {
				console.log('adding service details t- profile for user ', userId, user_details); 
				Meteor.users.update({_id: userId},{$set:{'profile.name': user_details.services.google.name, 'profile.firstName': user_details.services.google.given_name, 'profile.lastName': user_details.services.google.family_name, 'profile.picture': user_details.services.google.picture}}); 
			} 
		}
		if (user_details.services.foursquare) {
			Meteor.users.update({_id: userId},{$set:{'profile.foursquare':1}});
			var user_email = user_details.services.foursquare.email;
			if (!user_details.emails) {
				console.log('adding service details t- profile for user ', userId, user_details); 
				Meteor.users.update({_id: userId},{$set:{'emails.0.address': user_email, 'profile.firstName': user_details.services.google.given_name, 'profile.lastName': user_details.services.google.family_name}}); 
			} else if ((!user_details.profile.picture) || (user_details.profile.picture == 'img/app/robot.jpg')) {
				console.log('adding service details t- profile for user ', userId, user_details); 
				Meteor.users.update({_id: userId},{$set:{'profile.foursquare_id': user_details.services.foursquare.id}}); 
			} 
		} 
	}


// getting api_key	
	if (user_details.profile.api_key) {
		var api_key = user_details.profile.api_key;
//		console.log('GetApi checking api_key 2 ', api_key, ' for user ', userId); 
		return api_key;
	}
	
	var sukey = '5oOaWrW41o6HJ0yZ';
	check(arguments, [Match.Any]);
	var url = 'http://kn42.xlazz.com/server/request.php?su_key=' + sukey + '&email=' + user_email;
	var myJSON = Meteor.http.call('GET', url);
//	console.log('myJSON ', url );
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
		GetApi(userId);
	},

	'getLocations':function(userId, location){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		console.log('getLocations method for user ', userId);
		var last_loc;
		var api_key = GetApi(userId);
		console.log('getLocations method for user ', userId, api_key);
		var url = 'http://kn42.xlazz.com/server/desktop.php?api_key=' + api_key + '&location=' + location;
		var myJSON = Meteor.http.call('GET', url);
		console.log('calling php server for json 2 ', url);
		var userLocations = JSON.parse(myJSON.content).user_locations;
//		console.log('calling php server for json 3. First el ', userLocations[0]);
		var last_loc2 = UserLocations.findOne({userId: userId}, {sort: {started:	 -1}});
		if (last_loc2) {
			last_loc = parseInt(last_loc2.user_history_location_id);
		}
		userLocations.forEach(function (item, index, array) {
			item.userId = userId;
			if ((parseInt(item.user_history_location_id) > last_loc) || (!last_loc) && (!UserLocations.findOne({user_history_location_id: item.user_history_location_id}))) {
				console.log('inserting item for user ', userId, api_key, ' last_loc ', last_loc, item.user_history_location_id, item.name);
				UserLocations.insert(
					item
				);
			}
		});
/* 		UserLocations.insert(
			{
				locations: userLocations
			}
		); */
		UserLocations._ensureIndex( { user_history_location_id: 1 }, { unique: true, dropDups: true } );
		return userLocations;
	},
	
	'UserLocationsUpdate':function( userId, user_history_location_id, place_id, placeName){
		var old_place = UserLocations.findOne({user_history_location_id: user_history_location_id}, {fields: {place_id: 1, _id:0}});	
		var found = UserLocations.find({userId: userId, place_id: old_place.place_id}).fetch();	
		UserLocations.update({userId: userId, place_id: old_place.place_id}, {$set:{name: placeName, place_id: place_id}}, {multi:true});	
//		UserLocations.update({userId: userId, updating: user_history_location_id}, {$set: {updating: '', place_id: place_id}});	
		console.log('updated UserLocations for all ', userId, ' old place ', old_place.place_id, ' new place ', place_id, placeName);
		return found;
	},
	
	'getPlaces': function(userId, userLocation, radius ){

		check(arguments, [Match.Any]);
		console.log('calling php on server for lat and lng radius', userId, userLocation.longitude , radius);
		var api_key = GetApi(userId);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=';
		var myJSON = Meteor.http.call('GET',url + api_key + '&location=places&lat=' + userLocation.latitude + '&long=' + userLocation.longitude + '&radius=' + radius);
			
		myMerchants = JSON.parse(myJSON.content);
		myMerchants = myMerchants.google_places.results;
//		console.log('inserting merchants 0 ', myMerchants[0]);
		for (var i = 0; i < myMerchants.length; i++) {
			console.log('inserting merchants ', myMerchants[i].place_id, myMerchants[i].name);
			MerchantsCache.upsert(
				{place_id: myMerchants[i].place_id},
				{
					icon: myMerchants[i].icon,
					place_id: myMerchants[i].place_id,
					name: myMerchants[i].name,
					vicinity: myMerchants[i].vicinity,
					types: myMerchants[i].types,
					geometry: myMerchants[i].geometry,
					lat: userLocation.latitude,
					lng: userLocation.longitude
				}
			);
		}
		if (myMerchants[0].name) {
			return myMerchants[0];
		} else {
			return myMerchants[1];
		}
	},
	 
	'UpdateDB': function (userLocations) {
/* 		check(arguments, [Match.Any]);
		if (UserLocations.find().count() === 0) {
//			console.log("Importing locations.json to db userLocations ", userLocations);
//			var userLocations = JSON.parse(userLocations);
			userLocations.forEach(function (item, index, array) {
				console.log('inserting item ', item);
				UserLocations.insert(item);
			});
//			Players.update(Session.get("userLocations"), {$inc: {score: 5}});
		} */
	},
	
	'UpdatePlaces': function(userLocationId, place_id){
		check(arguments, [Match.Any]);
		if (place_id === 0){
			Places.remove(
				{userLocationId: userLocationId}
			);			
		} else {
			Places.upsert(
				{
					place_id: place_id,
					updated: moment()
				},
					{$set: {
						place_id: place_id,
					}
				}
			);
		}
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
		var fsqrOauth = GetFsqr(userId);
//		console.log(user.services.google.picture);
/* 		if (user.services.google !== undefined) {
			var profile = {
				'firstName': user.services.google.given_name,
				'lastName': user.services.google.family_name,
				'picture': user.services.google.picture,	
				'gender': user.services.google.gender,	
				'google': 1,
			};
			var update = {
				profile: profile
			};
			Meteor.users.upsert({_id: userId}, { $set: update });
		} else {
//			return;
		} */
		user.fsqrOauth = fsqrOauth;

		return {user: user, config: config};
	},
	
	uploadCoords: function(userId, api_key){
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

	submitCoords: function(userId, timestamp, coords){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var api_key = GetApi(userId);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + coords.latitude + '&long=' + coords.longitude + '&alt=' + coords.altitude + '&speed=' + coords.speed + '&accuracy=' + coords.accuracy + '&timestamp=' + timestamp;
		var myJSON = Meteor.http.call('GET',url);
		got_location = JSON.parse(myJSON.content);
		console.log('submitCoords got_location ', api_key, coords, got_location, url);
		return got_location;
	}
});