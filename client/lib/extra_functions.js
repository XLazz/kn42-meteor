startGeo = function(){
	Session.set('geoback', true );
	Session.set('interval', 1000000);
	UpdateGeo();
	PollingGeo();	
}

calculateDistanceLoc = function(coords1, coords2) {
	// if (Session.get('debug')) 
		// console.log('calculateDistanceLoc ', coords1, coords2);
	var distance = calculateDistance(coords1.latitude, coords1.longitude, coords2.latitude, coords2.longitude);
	return distance;
};

calculateDistance = function(lat1, lon1, lat2, lon2) {
	// if (Session.get('debug')) 
		// console.log('calculateDistance function ', lat1, lon1, lat2, lon2);	
	lat1 = parseFloat(lat1);
	lat2 = parseFloat(lat2);
	lon1 = parseFloat(lon1);
	lon2 = parseFloat(lon2);
  var R = 6371000; // m
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad(); 
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  var d = R * c;
  return d;
};

calculateCalories = function(activity, distance, timediff){
	activity = FitnessActivities.findOne(activity).activity;
	if (timediff == 0) {
		var calories = 0;
		return calories;	
	}
		
/* 	
	http://certification.acsm.org/metabolic-calcs
	Metabolic Equations for Gross VO2 in Metric Units

	Walking
	VO2 (mL . kg-1 . min-1) = (0.1 . S) + (1.8 . S . G) + 3.5 mL. kg-1.min-1

	Running
	VO2 (mL . kg-1 . min-1) = (0.2 . S) + (0.9 . S . G) + 3.5 mL. kg-1.min-1
	
	Leg Cycling
	VO2 (mL . kg-1 . min-1) = 1.8(work rate) / (BM) + 3.5 mL. kg-1.min-1+ 3.5 mL. kg-1.min-1
	
	Arm Cycling
	VO2 (mL . kg-1 . min-1) = 3(work rate) / (BM) + 3.5 mL. kg-1.min-1
	
	Stepping
	VO2 (mL . kg-1 . min-1) = (0.2 . f) + (1.33 . 1.8 . H . f) + 3.5 mL. kg-1.min-1
	
	VO2 is gross oxygen consumption in mL.kg-1.min-1
	S is speed in m.min-1
	BM is body mass (kg)
	G is the percent grade expressed as a fraction - not used for now
	Work rate (kg.m.min-1)
	f is the stepping frequency in minutes
	H is step height in meters
*/
	var calories;
	var weight = 70;
	timediff = timediff / 1000 / 60; // from ms to min
	var speed = distance / timediff;
	console.log(' speed ', speed, timediff, distance);
	var grade = 0; // assuming everything flat
	if (activity == 'walking') 
		calories = 0.005* ((0.1 * speed) + (1.8 * speed * grade) + 3.5) * weight * timediff;
	if (activity == 'running') 
		calories = 0.005 * ((0.2 * speed) + (0.9 * speed * grade) + 3.5) * weight * timediff;
	return calories;
};

Number.prototype.toRad = function() {
  return this * Math.PI / 180
};

truncateDecimals = function (number, digits) {
    var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
};

submitCoords = function(userId, geoId, location ){
/* 	Meteor.call('submitCoords',  userId, geoId, location, function(err,results){
		console.log('submitCoords to php, gor results ', userId,  results);
		console.log('submitCoords to php, gor results ', userId, ' results.location_id ', results.location_id, ' coords ', location.coords, ' geoId ', geoId);			
	}); */
}

PollingGeo = function(){
	var myInterval = Session.get('interval');
	if (!Session.get('interval')) {
		myInterval = 900000;
	} 
	var watchGPS;
	console.log('Polling geo 1 ', myInterval, Session.get('geoback'));
	// auto-re-run by Cordova every myInterval ms
	if (Session.get('geoback') == true) {
		var runGeo = function() {

			if (Meteor.isCordova) {
				if (!Session.get('geoback')) {
					console.log('cleaning interval inside runGeo ', Session.get('watchGPS'));
					Meteor.clearInterval(Session.get('watchGPS'));
				}
				console.log('Polling geo 2 cordova inside interval ', myInterval, Session.get('geoback'), Session.get('watchGPS'));
				UpdateGeoCordova();
			} else {
				console.log('Polling geo 2 browser inside interval ', myInterval, Session.get('geoback'), Session.get('watchGPS'));
				UpdateGeo();
			}
		}
		if (Session.get('watchGPS'));
			Meteor.clearInterval(Session.get('watchGPS'));
		var watchGPS = Meteor.setInterval(runGeo, myInterval);
		Session.set('watchGPS', watchGPS);
	} else {
		console.log('Cleaning interval ', myInterval, Session.get('geoback'), Session.get('watchGPS'));		
		Meteor.clearInterval(Session.get('watchGPS'));
		Session.set('watchGPS', false);
	}
}

addPlace = function (geoId, location){
	userId =  Meteor.userId();
	var radius = 30; //stationary and google search radius
	var results;
	var currentPlace;
	var current_status;
	if (!location) {
		console.error('upsertPlaceId no location ',location);
		return;
	}
	if (!location.coords) {
		console.error('upsertPlaceId no location.coords ',location);
		return;
	}
	console.log('addPlace ', location);

	//Lets add check for non-significant coords changes in here	
	// check come here!
		
	//we have coords, lets check google
	var initiator = 'addPlace function';
	var params = {
		location: location,
		radius: radius,
		geoId: geoId
	};
	
	Meteor.call('getGLoc', userId, params, initiator, function(err,results){
		var experience;
		console.log('getGLoc call in addPlace ', results);				
		if (!results)
			return;
	});

}

UpdateGeo = function (){
//	var handle = Deps.autorun(function () {
	var userId = Meteor.userId();
	var location = Geolocation.currentLocation();
	if (!location)
		return;
	console.log('UpdateGeo event ', location, 'fitActivity:', Session.get('fitActivity'), 'fithnes:', Session.get('fitness'), Session.get('fitstart'), Session.get('fitstop'), 'fitnessTrackId', Session.get('fitnessTrack') );
	var uuid = Meteor.uuid();
	var device = 'browser';
	UpdateGeoDB(location, uuid, device);	
	return location;
};

UpdateGeoCordova = function(){
	if (!Session.get('geoback')) {
		console.log('cleaning interval inside UpdateGeoCordova ', Session.get('watchGPS'));
		Meteor.clearInterval(Session.get('watchGPS'));
	}
	var userId = Meteor.userId();
	GeolocationFG.get(function(geolocation) {
		console.log('UpdateGeoCordova ',  geolocation, this);
		var uuid = GeolocationBG2.uuid();
		var device = GeolocationBG2.device();
		UpdateGeoDB(geolocation, uuid, device);
		return location;
	});
}

UpdateGeoDB = function(geolocation, uuid, device){
	if (!Session.get('geoback')) {
		Meteor.clearInterval(Session.get('watchGPS'));
	}
	var distance;
	var avgspeed;
	var oldLocation;
	var userId = Meteor.userId();
	geolocation.distance = 0;
	geolocation.avgspeed = 0;
	var location = {
		location: geolocation,
		uuid: uuid,
		device: device,
		userId: userId,
		created: new Date(),
		timestamp: moment().valueOf(),
		interval: Session.get('interval'),
	}
	
	if (Session.get('debug'))
		console.log('UpdateGeoDB ',  'watchGPS', Session.get('watchGPS'), location, 'fitness', Session.get('fitActivity'), Session.get('fitness'), Session.get('fitstart'), Session.get('fitstop'), Session.get('fitnessTrack'), 'driving', Session.get('driving'), Session.get('driveTrack') );

	oldLocation = GeoLog.findOne(Session.get('locationId'));
	if (!oldLocation) {
		oldLocation = GeoLog.findOne({userId: userId},{timestamp: -1});
		if (!oldLocation) {
			var geoId = GeoLog.insert(location);		
			oldLocation = GeoLog.findOne(geoId);
			Session.set('locationId', oldLocation._id);	
			if (Session.get('debug'))
				console.log('UpdateGeoDB 1.1 ',  ' oldLocation ', oldLocation );
			return;
		} else {
			if (Session.get('debug'))
				console.log('UpdateGeoDB 1.2 ',  ' oldLocation ', oldLocation );
			Session.set('locationId', oldLocation._id);		
		}
	} 
	

	if (Session.get('debug'))
		console.log('UpdateGeoDB 2 ',  'locationId ', Session.get('locationId'), ' location ', location, ' oldLocation ', oldLocation, ' geolocation ', geolocation );
	

		// if (Session.get('location').speed)

	if (Session.get('debug')) 
		console.log(oldLocation, location);

	// adding logs for fitness session
	if (Session.get('fitness')){
		location.activityId = Session.get('fitActivity');
		location.fitnessTrackId = Session.get('fitnessTrackId');
		Tracks.insert(location);
	}

	// adding logs for driving session
	if (Session.get('driving')){
		console.log('driveTrackId ', Session.get('driveTrackId'));
		location.driveTrackId = Session.get('driveTrackId');
		Drives.insert(location);		
	}	

	location.location.distance = calculateDistance(oldLocation.location.coords.latitude, oldLocation.location.coords.longitude, location.location.coords.latitude, location.location.coords.longitude);
	timediff = parseInt(location.location.timestamp) - parseInt(oldLocation.location.timestamp);
	location.location.avgspeed = Math.round(location.location.distance / timediff * 100 ) / 100;
	location.location.distance = Math.round(location.location.distance * 100 ) / 100; //m
	
	// Main geolog, only when not fitness or driving in place
	if ((Session.get('fitness')) || (Session.get('driving')))
		return;
	if (oldLocation.location.timestamp == location.location.timestamp) {
		console.log('same location.timestamp, exiting');
		return;
	}
	
	if (Session.get('debug')) 
		console.log(' adding to geolog ', location);
	var status;
	if (!Session.get('userPlaceId'))
		Session.set('userPlaceId', UserPlaces.findOne({userId:userId}, {sort: {timestamp: -1}, fields:{_id:1}}));	
	var userPlace =  UserPlaces.findOne(Session.get('userPlaceId'));
	if (!userPlace) {
		Session.set('userPlaceId', UserPlaces.findOne({userId:userId}, {sort: {timestamp: -1}, fields:{_id:1}}));	
		if (!Session.get('userPlaceId')) {
			addPlace(location._id, location.location);
			Session.set('userPlaceId', UserPlaces.findOne({userId:userId}, {sort: {timestamp: -1}, fields:{_id:1}}));
		}	
	}
	
	// now let's check if stationary
	var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
	if (!userPlace) {
		Session.set('userPlaceId', UserPlaces.findOne({userId:userId}, {sort: {timestamp: -1}, fields:{_id:1}}));	
		userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		if (!Session.get('userPlaceId')) {
			addPlace(oldLocation._id, oldLocation.location);
			Session.set('userPlaceId', UserPlaces.findOne({userId:userId}, {sort: {timestamp: -1}, fields:{_id:1}}));
		}	
	}
	location.stationary = ifStationary(location, oldLocation, userPlace);

	location._id = GeoLog.insert(location);	
	Session.set('locationId', location._id);	

	if (Meteor.status().connected)
		submitCoords(userId, location._id, location.location );	

	// see if we need finalise userplace or add a new one
	if (!userPlace)
		return;
	// if not stationary and not finalised, then finalise it
	if ((!userPlace.timestampEnd) && (!location.stationary))
		UserPlaces.update(Session.get('userPlaceId'),{$set:{timestampEnd: location.timestamp}});
	// if stationary and old userplace finalised, create new
	if ((userPlace.timestampEnd) && (location.stationary)){
		if (!UserPlaces.findOne(Session.get('userPlaceId'),{fields: {timestampEnd: 1, _id: 0}})) {
			location.timestampEnd = userPlace.timestamp + 60000;
			UserPlaces.update(Session.get('userPlaceId'),{$set:{timestampEnd:location.timestampEnd, oldId: Session.get('userPlaceId')}});
		}
		var newUserPlace = {
			userId: userPlace.userId,
			location: location.location,
			started:  moment(location.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
			timestamp: location.timestamp,
			geoId: location._id,
			origin: 'UpdateGeoDB'
		};
		newUserPlaceId = UserPlaces.insert(newUserPlace);
		// and update userPlace session with the new userPlace
		Session.set('userPlaceId', newUserPlaceId);	
	}
};

ifStationary = function(location, oldLocation, userPlace){
	
	if ((!location) || (!oldLocation))
		return;
	var distance;
	location.stationary = true;
	if (location.location.coords.speed > 5)
		location.stationary = false;
	if (location.location.coords.speed > 1) {
		if (location.location.coords.avgspeed > 0.1)
			location.stationary = false;
	} else {
		if (oldLocation.stationary) {
			if (!userPlace)
				return;
			if (!userPlace.location)
				return;
			if (Session.get('debug')) {
				console.log('if location.stationary 1. going with userplace loc: ', location, ' distance ', distance);
				console.log('if location.stationary 1.a going with userplace loc: ', location.location.coords, ' distance ', distance);
				console.log('if location.stationary 1.1 going with userplace oldLoc: ', oldLocation, ' distance ', distance );
				console.log('if location.stationary 1.1b going with userplace oldLoc: ', oldLocation.location.coords, ' distance ', distance );
			}
			distance = calculateDistance(location.location.coords.latitude, location.location.coords.longitude, userPlace.location.coords.latitude, userPlace.location.coords.longitude);
		} else {
			distance = calculateDistance(location.location.coords.latitude, location.location.coords.longitude, oldLocation.location.coords.latitude, oldLocation.location.coords.longitude);	
			if (Session.get('debug')) 
				console.log('if location.stationary 2. going with oldLocation ', location.stationary, ' distance ', distance, oldLocation.stationary);
		}
		if (distance > 30)
			location.stationary = false;
	}	
	if (Session.get('debug')) 
		console.log('if location.stationary 3 ', location.stationary, ' distance ', distance, location.location.coords, userPlace.location.coords, ' speed ', location.location.coords.speed, ' avgspeed ',location.location.coords.avgspeed, userPlace, location);
	return location.stationary;
};

findClaimed = function(userId, coords){
	var radius_search = 0.001;
	var latup = parseFloat(coords.latitude) + radius_search;
	var latdown = parseFloat(coords.latitude) - radius_search;
	var lngup = parseFloat(coords.longitude) + radius_search;
	var lngdown = parseFloat(coords.longitude) - radius_search;

//		lat2 = lat2.toString()
	var claimed = ClaimedPlaces.findOne({'coords.latitude': { $gt: latdown, $lt: latup }, 'coords.longitude': { $gt: lngdown, $lt: lngup }});
	if (Session.get('debug'))
		console.log('check claimed ', latup, latdown, lngup, lngdown, claimed);
	return claimed;
}

getGPlace = function(place_id){
	var callGoogle;
	var place;
//	var place = Places.findOne({place_id: place_id});
//	if (!place) {
		
/* 	if (Session.get('googleCall')) {
		var now = moment().valueOf() - Session.get('googleCall');
		console.log('getGPlace session 1 ', Session.get('googleCall'), now);
		if (moment().valueOf() - Session.get('googleCall') > 2) {
			console.log('getGPlace session 2 ', Session.get('googleCall'), now);
			Session.set('googleCall', false);	
		}
	} */
	
	console.log('getGPlace session 3 ', Session.get('googleCall'), place_id);
	if (!Session.get('googleCall')){
		Session.set('googleCall',  moment().valueOf());
		console.log('Google call getGPlace in getGPlace function ', place_id);
		place = Meteor.call('getGPlace', place_id, function(err, results) {
			console.log('getGPlace ', results);
			if (results) {
				if (results.result.place_id.length > 25) {
					var initiator = 'getGPlace function';
					// Meteor.call('getGLoc', Meteor.userId(), Session.get('userLocation').location, 30, initiator);
				}
				Session.set('googleCall', false);	
				return results;
			}
		});

	}
	if (!place)
		return;
	return place;
};

getGLoc = function(){
	console.log('getGLoc function ', moment().format("MM/DD HH:mm:ss.SSS"));
	if (Session.get('getGLoc')) 
		return;
	Session.set('getGLoc', moment().valueOf());
	Meteor.setTimeout(function(){
		Meteor.call('getGLoc', userId, params, initiator, function(err, results) {
			if (results)
			console.log('getGLoc 2 called getGLoc ', results);
		});	
	}, 20000);

};

updateOnePlace = function(userPlaceId){
	var userPlace = UserPlaces.findOne(userPlaceId);
	if  (Session.get('debug'))
		console.log('updateOnePlace 1  ', userPlace);	
	if (!Session.get('geoback')) 
		startGeo();
	if (!userPlace)
		return;
	if (!userPlace.location) {
		if (Session.get('debug'))	{
			console.log('userPlace ', userPlace);
			console.log('userPlace.location ', userPlace._id, userPlace.timestamp, userPlace.location);
		}
		var location = GeoLog.findOne({userId:userId}, {sort: {timestamp: -1}});
		userPlace.location = location.location;
		if (!userPlace.location)
			return;
	}
		// if (userPlace.place_id) {
			// return;
		// }
	var params = {};
	params.radius = 20;
	params.location = userPlace.location;

//		geoId: Session.get('locationId'),
	params.userPlaceId = userPlaceId;
	
	var initiator = 'updateOnePlace';
	if  (Session.get('debug'))
		console.log('updateOnePlace 2 with  ', params, initiator, moment().valueOf() - Session.get('updatePlaces')  - 4000);	
	if (moment().valueOf() < Session.get('updatePlaces')  + 4000 ) 
		return;

	
	Session.set('updatePlaces', moment().valueOf());
	Meteor.setTimeout(function(){
		console.log('updateOnePlace getGLoc calling ');	
		Meteor.call('getGLoc', Meteor.userId(), params, initiator, function(err, results){
			console.log('updateOnePlace getGLoc results ', results);	
			// return results;
			Session.set('updatePlaces', 0);
		});
	}, 3000);	
	
};	
		
updateEmptyPlaces = function(){
//	console.log('updateEmptyPlaces function 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
	var timelimit = 1000;
	if (!Session.get('updatePlaces'))
		Session.set('updatePlaces', 0);
	if ((moment().valueOf() < Session.get('updatePlaces')  + 2000 )) {
		if (Session.get('debug'))
			console.log('recent call to updateEmptyPlaces ', moment().valueOf() - Session.get('updatePlaces') - 2000 , ' was ', moment(Session.get('updatePlaces')).format("MM/DD HH:mm:ss.SSS"), ' now ', moment().format("MM/DD HH:mm:ss.SSS"));
		return;
	}
	var initiator = 'updateEmptyPlaces function';
	Session.set('updatePlaces', moment().valueOf());
	console.log('updateEmptyPlaces function 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
	Meteor.setTimeout(function(){
		Meteor.call('updatePlaces', Meteor.userId(), initiator, Session.get('debug'), function(err, results) {
			console.log('updatePlaces call  ', Meteor.userId(), results);
			return results;
			Session.set('updatePlaces', 0);
		});
	}, timelimit);	
		
//	});
}

updateEmptyNames = function(){
//	console.log('updateEmptyPlaces function 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
	var timelimit = 3000;
	if (!Session.get('updateNames'))
		Session.set('updateNames', 0);
	if ((moment().valueOf() - Session.get('updateNames') < 60000 )) {
		if (Session.get('debug'))
			console.log('recent call to updateNames ', moment().valueOf() - Session.get('updateNames') - timelimit, ' was ', moment(Session.get('updateNames')).format("MM/DD HH:mm:ss.SSS"), ' now ', moment().format("MM/DD HH:mm:ss.SSS"));
		return;
	}
	var initiator = 'updateNames function';
	Session.set('updateNames', moment().valueOf());
	console.log('updateNames function 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
	Meteor.setTimeout(function(){
		Meteor.call('updatePlaceNames', Meteor.userId(), initiator, Session.get('debug'), function(err, results) {
			console.log('updatePlaceNames call  ', Meteor.userId(), results);
			return results;
			Session.set('updateNames', 0);
		});
	}, timelimit);	

}

UpdateProfile = function(userId){
	var user_details = Meteor.users.findOne(userId);
	var user_email;
	if (!user_details) {
		return;
	}
	if (!user_details.emails) {
		console.log('no standard email, getting it from services ');
		user_details.emails = {};
		user_details.emails[0] = [];
		user_details.emails[0].address = user_details.services.google.email;
		Meteor.users.upsert(userId, {$set: user_details});
//		Meteor.users.upsert(userId, {$set: user_details});
	}
};