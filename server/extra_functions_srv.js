GetApi = function(userId){
	if (!userId) {
		console.error('GetApi no userId, no key');
		return;
	}

	var create_profile;
	var user_email;
	var user_details = Meteor.users.findOne({_id: userId}, {_id:0});
	if (!user_details)
		return;
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
	
	user_details = Meteor.users.findOne(userId, {_id:0});
	if (!user_details.emails) {
		if (user_details.services.google.email) {
			user_details.emails = [];
			user_details.emails[0] = {};
			user_details.emails[0].address = user_details.services.google.email;
			Meteor.users.upsert(userId, user_details);
			user_details = Meteor.users.findOne(userId, {_id:0});
		} else {
			return;
		}		
	}
	
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

fsqrApi = function(userId){
	var user_details = Meteor.users.findOne(userId);
//	console.log('fsqrAPI 1 ', userId, user_details);
	if (!user_details) {
		console.log('fsqrAPI 1.5 ', userId, user_details);
		return user_details;
	}
	console.log('fsqrAPI 2 ', userId, user_details.services);
	console.log('fsqrAPI 3 ', userId, user_details.services.foursquare);
	if (user_details.services.foursquare) {
		fsqrToken = user_details.services.foursquare.accessToken;
		console.log ('token ', fsqrToken);
		if ((!user_details.profile.foursquareId)||(!user_details.profile.foursquare)) 
			console.log('updating user profile with fsqr ',  user_details.services.foursquare.id);
			Meteor.users.upsert({_id: userId}, {$set:{'profile.foursquare':1, 'profile.foursquareId': user_details.services.foursquare.id}});
		return fsqrToken;
	}
}

UpdateProfile = function(userId){
	var user_details = Meteor.users.findOne({_id: userId}, {_id:0});
	var user_email;
	if (!user_details) {
		return;
	}
	if (!user_details.emails) {
		user_details.emails = {};
		user_details.emails[0] = [];
		user_details.emails[0].address = user_details.services.google.email;
	}
	if (user_details.emails[0].address == 'stan@podolski.org') {
		if (!user_details.admin) 
			Meteor.users.update(userId, {$set:{admin:true}});
		if (!Houston._admins.findOne({user_id: userId}))
			Houston._admins.insert({user_id: userId});
	
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

getCoords = function(userId) {
	var api_key = GetApi(userId);
	var url = 'http://kn42.xlazz.com/server/desktop.php?api_key=' + api_key + '&coords=' + list;
	var myJSON = Meteor.http.call('GET', url);
	var userCoords = JSON.parse(myJSON.content).user_locations;
	console.log('calling php server for coords. url', url , 'num of els ', userCoords.length);
	userCoords.forEach(function (item, index, array) {
		console.log('inserting coords ', item);
//		Meteor.call('GetGoogleLoc', userId, coords, radius));
//			GeoLog.upsert(item.locationId,{$set: item});
	});
}

GetFsqrLoc = function(coords, limit, query){
	var today = moment().format('YYYYMMDD');
	
	try {
		var url = 'https://api.foursquare.com/v2/venues/search?ll=' + coords.latitude +',' + coords.longitude + '&oauth_token=' + fsqrToken + '&limit=' + limit + '&v=20150215';
		if (query)
			if (query.what)
				var url = 'https://api.foursquare.com/v2/venues/search?ll=' + coords.latitude +',' + coords.longitude + '&oauth_token=' + fsqrToken + '&v=20141208&query=' + query.what + '&radius=' + query.radius ;
		var myJSON = Meteor.http.call('GET',url);
		var venues = JSON.parse(myJSON.content);
		return venues;
	} catch(e){
		console.error('error calling fsqr ', e, e.response);
		return false;
	}
	console.log('calling fsqr final. never should come here ', response);
}

GetFsqrChk = function(limit){
	var today = moment().format('YYYYMMDD');
	
	try {
		var url = 'https://api.foursquare.com/v2/users/self/checkins?oauth_token=' + fsqrToken + '&v=20150211' + '&limit=' + limit;
		console.log('GetFsqrChk url', url);
		var myJSON = Meteor.http.call('GET', url);
		var response = JSON.parse(myJSON.content);
		return response;
	} catch(e){
		console.error('error calling fsqr ', e, e.response);
		return false;
	}
	console.log('calling fsqr final. never should come here ', response);
}

CheckInFsqr = function(venueId){

	try {
		var url = 'https://api.foursquare.com/v2/checkins/add';
		var myJSON = Meteor.http.call("POST", url, 
			{ params: 
				{ 
				oauth_token: fsqrToken, 
				venueId: venueId,
				v: '20150211',
				m: 'swarm'
				}
			}
		) ;
		var venues = JSON.parse(myJSON.content);
		var limit = 1;
		GetFsqrChk(limit);
		return venues;
	} catch(e){
		console.error('error calling fsqr ', e, e.response);
		return false;
	}
	console.log('calling CheckInFsqr final. never should come here ', response);
}

GetGoogleLoc = function(userId, coords, radius, name){
	var response;
	console.log('GetGoogleLoc userId ', userId, 'radius ', radius, 'name ', name);
/* 	if ((!userLocation.location) && (userLocation.timestamp)) {
		var userLocation = GeoLog.findOne({userId: userId, timestamp: userLocation.timestamp});
		userLocation = userLocation.location;
	} */
//	console.log('calling google 1 ', coords);
  try {	
		var location = coords.latitude + ',' + coords.longitude;
		var radius = radius;
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
		url = url +'?location=' + location + '&key=' + google_server_key + '&radius=' + radius + '&name=' + name;
//		console.log('calling google 0 ', url);
		var response1 = Meteor.http.call("GET", url);
/*     var response1 = Meteor.http.call("GET", url,
									{params: 
										{
											location: location,
											radius: radius,
											key: google_server_key
										}
									}); */
		response =  JSON.parse(response1.content);
//		console.log('response calling google length ', response.results.length);
//		Meteor._sleepForMs(1000);
		return response;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
		console.error('error calling google ', e, e.response);
		return false;
  } 
	console.log('calling google final. never should come here ', response);
}

GetGooglePlace = function(place_id){

  try {	
		var google_server_key = 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA';
		parameters = 'placeid=' + place_id + '&key=' + google_server_key;
		var url = 'https://maps.googleapis.com/maps/api/place/details/json?' + parameters;
//		console.log('calling google for place vy place_id ', url);
		var response1 = Meteor.http.call("GET", url);
/*     var response1 = Meteor.http.call("GET", url,
									{params: 
										{
											location: location,
											radius: radius,
											key: google_server_key
										}
									}); */
		response =  JSON.parse(response1.content);
//		console.log('response calling google place_id ');
		Meteor._sleepForMs(1000);
		return response;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
		console.error('error calling google place_id ', e, e.response);
		return false;
  } 	
}

GoogleMaps.getReverseGeocode = function(params){
	var api = Meteor.wrapAsync(GoogleMaps.reverseGeocode.bind(GoogleMaps));
	var data = api(
		params.latlng,
		params.callback
	);
  console.log(data);
  return data;
}

GoogleMaps.getPlaces2 = function(params){
	console.log('GoogleMaps.getPlaces ', params);
	var api = Meteor.wrapAsync(GoogleMaps.places.bind(GoogleMaps));
	var data = api(
		params.latlng,
		params.radius,
		params.google_server_key,
		params.callback,
		params.sensor,
		params.types,
		params.lang,
		params.name
	);
  console.log(data);
  return data;
}

GoogleMaps.getPlaces = function(params){
	console.log('GoogleMaps.getPlaces ', params);
/* 	GoogleMaps.places(
		params.latlng,
		params.radius,
		params.google_server_key,
		function (error, data) {
			console.log('places ');
			if (error) {
				console.error(error);
				return;
			}
			return data;
		},
		params.sensor,
		params.types,
		params.lang,
		params.name
	); */
	console.log('places response ', response);
	return response
}

ifStationary = function(userId, geoId){
	var stat_time = 200000;
	var geoLoc = GeoLog.findOne(geoId);
	if (!geoLoc)
		return;
	var geoLocOld = UserPlaces.findOne({userId:userId},{sort: {timestamp: -1}});
	if (!geoLocOld)
		return;
	console.log('old place from GeoLog ', geoLocOld._id, ' new place ', geoLoc._id);		

	// if previous stationary place_id from GeoLog is the same as new one, we are stationary
	if ((geoLocOld.place_id == geoLoc.stationary_place_id) || (geoLocOld.geo_place_id == geoLoc.place_id)) {
		// updating geolog with new stationary status
		console.log('Same place ', geoLoc.stationary_place_id);
		GeoLog.upsert(geoId, {$set: {status:  'stationary'}});						
		// and let's check if user has spent enough time to make it userplace
	} else {
		// if previous stationary place_id is not the same and userplace is not finalised, then finalise it, user is officially on the move
		console.log('moved to ', geoLoc.stationary_place_id, ' or ', geoLoc.place_id ,' from ', geoLocOld.place_id );
		current_status = '';
		var userplace = UserPlaces.findOne({userId:userId, place_id: geoLocOld.stationary_place_id },{sort:{timestamp: -1}});				
		if (!geoLocOld.timestampEnd) {
			//if place was not finalized, then add timestampEnd
			geoLocOld.timestampEnd = moment().valueOf();
			if (geoLocOld._id)
				UserPlaces.upsert(geoLocOld._id, {$set: {timestampEnd: geoLocOld.timestampEnd }});
			// and submit to server with the timestampEnd
			// location.timestampEnd = oldLoc.timestamp;
			// location.userplaceId = userplace._id;
			// Meteor.call('submitPlace', userId, location, experience);

			//					console.log('User has moved from ', lastLoc.stationary_place_id, ' to ', currentPlaceAlt.place_id);
		} else {
			// let's check if user is in current place_id for a long time
			var diffstamp = moment().valueOf() - stat_time;
			var ifStat = GeoLog.findOne({userId: userId, timestamp: {$lt: diffstamp}},{sort:{timestamp: -1}});
			if (!ifStat)
				return;		
			if (!ifStat.place_id == geoLoc.place_id)
				return;		
			//since user static for enough, let;s add UserPlace
			console.log('User stationary for ', stat_time, ' in ', geoLoc.stationary_place_id);
			UserPlaces.insert(
			{
				geoId: geoId,
				userId: userId,
				place_id: geoLoc.stationary_place_id,
				geo_place_id: geoLoc.place_id,
				started:  moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
				timestamp:  moment().valueOf(),
				location: geoLoc.location
			});	
				
		}
		// updating geolog with new place
	}
	
}

ifStatic = function(userId, currentPlace, currentPlaceAlt, location){
// Add userplace if user becomes static for some time;
	if (!userId)
		return;
	var stat_time = 200000;
	var timestamp = location.timestamp;
	var insert_it;
	var userplaceId;
	var experience = {};
	experience.had = '';
	experience.stars = '';
	experience.comment = '';
	var diffstamp = moment().valueOf() - stat_time;
	var lastLoc = GeoLog.findOne({timestamp: {$lt: diffstamp}, userId: userId},{sort:{timestamp: -1}});
	if (!lastLoc)
		return;
	console.log('lastLoc if user has moved from ', lastLoc.stationary_place_id);
	var lastPlace = UserPlaces.findOne({userId: userId}, {sort: {started: -1}});
	if (!lastLoc.stationary_place_id == currentPlaceAlt.place_id)
		return;

	//since user static for enough, let;s add UserPlace
	console.log('User stationary for ', stat_time, ' in ', lastLoc.stationary_place_id);
	currentPlace.timestamp = lastLoc.timestamp;
	currentPlace.geoId = lastLoc._id
	
	if (!lastPlace) {
		console.log('ifStatic no last place, calling php server ');
/* 		Meteor.call('getLocations', userId, 'list', function(err,results){
			if (results) {
				if (!results.length)
					insertPlace(userId, lastLoc, currentPlaceAlt);
				console.log('calling php server for json 2 ', results.length);
			}
		}); */
	} else {
		if (lastPlace.timestampEnd) {
			var claimed = findClaimed(userId, lastLoc.location.coords);
			if (claimed)
				currentPlaceAlt.place_id = claimed.place_id;		
			if (lastPlace.place_id !== currentPlaceAlt.place_id)
				insertPlace(userId, lastLoc, currentPlaceAlt);
		} 
	}
		
//		alert ('moved');
	
}


GoogleMaps.asyncPlaces = Async.wrap (GoogleMaps.places);

updatePlace = function(data) {
	if (data.results) {
		if (data.results[1]) {
			place_id = data.results[1].place_id;
		} else {
			place_id = data.results[0].place_id;
		}
	}
	UserPlaces.update({foursquareId: data.foursquareId}, {$set: {place_id: place_id}}, {multi:true});
}