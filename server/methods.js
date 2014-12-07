GetFsqr = function(userId){
	if (!userId) {
		console.error('FsqrApi no userId, no key');
		return;
	}
	var fsqrOauth = Meteor.users.findOne({_id: userId}, {'user_details.services.foursquare.accessToken': 1, _id:0});
	return fsqrOauth; 
}

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
			Meteor.users.update({_id: userId}, {$set:{'profile.google':1}});
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
		if (!userLocation)
			return;
		if (!radius)
			var radius = 50;
		check(arguments, [Match.Any]);
		
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
		
		console.log('calling php on server for lat and lng radius', userId, userLocation.user_history_location_id , userLocation.place_id, radius);
		var api_key = GetApi(userId);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=';
		var myJSON = Meteor.http.call('GET',url + api_key + '&location=places&lat=' + userLocation.latitude + '&long=' + userLocation.longitude + '&radius=' + radius);
			
		myMerchants = JSON.parse(myJSON.content);
		myMerchants = myMerchants.google_places.results;
		if (!myMerchants)
			return;
		if (!myMerchants[0])
			return;
			
		if (!UserLocations.findOne({user_history_location_id: userLocation.user_history_location_id}).name) {
			if (myMerchants[0].name) {
				name = myMerchants[0].name;
			} else if (myMerchants[1].name) {
				name = myMerchants[1].name;
			}			
			console.log('updating userLocation with name ', name);
			UserLocations.update({user_history_location_id: userLocation.user_history_location_id}, {$set: {name: name}});
		}
//		console.log('inserting merchants 0 ', myMerchants[0]);
		for (var i = 0; i < myMerchants.length; i++) {		
			if (MerchantsCache.findOne({lat: userLocation.latitude, lng: userLocation.longitude,	place_id: {$size: 0} })){
				console.log('inserting merchants ', myMerchants[i].place_id, myMerchants[i].name);
				MerchantsCache.upsert(
					{
						lat: userLocation.latitude,
						lng: userLocation.longitude,					
					},{
						icon: myMerchants[i].icon,
						place_id: myMerchants[i].place_id,
						name: myMerchants[i].name,
						vicinity: myMerchants[i].vicinity,
						types: myMerchants[i].types,
						geometry: myMerchants[i].geometry,
						lat: userLocation.latitude,
						lng: userLocation.longitude,
						updated: new Date(),
						user_history_location_id: userLocation.user_history_location_id,
					}
				);			
			} else if (!MerchantsCache.findOne({place_id: myMerchants[i].place_id })){
				MerchantsCache.upsert(
					{
						place_id: myMerchants[i].place_id,	
					},{
						icon: myMerchants[i].icon,
						place_id: myMerchants[i].place_id,
						name: myMerchants[i].name,
						vicinity: myMerchants[i].vicinity,
						types: myMerchants[i].types,
						geometry: myMerchants[i].geometry,
						lat: userLocation.latitude,
						lng: userLocation.longitude,
						updated: new Date(),
						user_history_location_id: userLocation.user_history_location_id,
					}
				);					
			}
		}
		if (!myMerchants[0])
			return;
		if (myMerchants[0].name) {
			return myMerchants[0];
		} else {
			return myMerchants[1];
		}
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