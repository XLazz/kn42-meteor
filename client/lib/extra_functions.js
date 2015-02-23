calculateDistance = function(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
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
	Meteor.call('submitCoords',  userId, geoId, location, function(err,results){
		console.log('submitCoords to php, gor results ', userId,  results);
		console.log('submitCoords to php, gor results ', userId, ' results.location_id ', results.location_id, ' coords ', location.coords, ' geoId ', geoId);			
	});
}

PollingGeo = function(){
	var myInterval = Session.get('interval');
	if (!Session.get('interval')) {
		myInterval = 150000;
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
	var geoId;
	// geoId = GeoLog.findOne({timestamp: location.timestamp, userId: userId},{fields:{_id:1}});
	console.log('UpdateGeo event ', location, geoId, 'fitActivity:', Session.get('fitActivity'), 'fithnes:', Session.get('fitness'), Session.get('fitstart'), Session.get('fitstop'), 'fitnessTrackId', Session.get('fitnessTrack') );
	if (!geoId){
		var uuid = Meteor.uuid();
		var device = 'browser';
		UpdateGeoDB(location, uuid, device);
	}
	return location;
};

UpdateGeoCordova = function(){
	if (!Session.get('geoback')) {
		console.log('cleaning interval inside UpdateGeoCordova ', Session.get('watchGPS'));
		Meteor.clearInterval(Session.get('watchGPS'));
	}
	var userId = Meteor.userId();
	GeolocationFG.get(function(location) {
		console.log('UpdateGeoCordova ',  location, this);
/* 		if (location.coords.speed) {
			Session.set('interval', 50000);
		} else {
			Session.set('interval', 800000);
		} */
		var geoId = GeoLog.findOne({timestamp: location.timestamp, userId: userId},{fields:{_id:1}});
		if (!geoId) {
			var uuid = GeolocationBG2.uuid();
			var device = GeolocationBG2.device();
			UpdateGeoDB(location, uuid, device);
		}
	//		Session.set('interval', 60000);
		
		return location;
	});
}

UpdateGeoDB = function(location, uuid, device){
	if (!Session.get('geoback')) {
		Meteor.clearInterval(Session.get('watchGPS'));
	}
	var distance;
	var avgspeed;
	var userId = Meteor.userId();
	var geoId = GeoLog.findOne({timestamp: location.timestamp, userId: userId},{fields:{_id:1}});
	var timestamp = moment().valueOf();
	console.log('UpdateGeoDB ',  'watchGPS', Session.get('watchGPS'), location, 'fitness', Session.get('fitActivity'), Session.get('fitness'), Session.get('fitstart'), Session.get('fitstop'), Session.get('fitnessTrack'), 'driving', Session.get('driving'), Session.get('driveTrack') );

	if (Session.get('location')) {
		// if (Session.get('location').speed)
		if (Session.get('location').coords.speed) {
			distance = calculateDistance(Session.get('location').coords.latitude, Session.get('location').coords.longitude, location.coords.latitude, location.coords.longitude);
			timediff = location.timestamp - Session.get('location').timestamp;
			var avgspeed = distance / timediff;
		} else {
			distance = 0;
			avgspeed = 0;
		}
		console.log('distance ', distance);
	} else {
		distance = 0;
		avgspeed = 0;
	}
	location.distance = distance;
	location.avgspeed = avgspeed;
	Session.set('location', location);	
	
	if (Session.get('fitness')){
		if (!Session.get('fitnessTrack')) {
			var fitnessTrackId = FitnessTracks.insert({userId: userId, activityId: Session.get('fitActivity'), timestamp: timestamp, created: new Date()});
			var fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
			Session.set('fitnessTrack', fitnessTrack);
		}		
		Tracks.insert({
			location: location,
			uuid: Meteor.uuid(),
			device: device,
			userId: Meteor.userId(),
			created: new Date(),
			activityId: Session.get('fitActivity'),
			interval: Session.get('interval'),
			fitnessTrackId: Session.get('fitnessTrack')._id,		
		});		
		if (!Session.get('fitnessTrack').fitnessStart) {	
			console.log('adding fitnessStart ');
			var fitnessTrack = Session.get('fitnessTrack');
			var fitnessStart = Tracks.findOne({fitnessTrackId:fitnessTrack._id},{sort: {created: -1}});
			console.log('adding fitnessStart 1 ', fitnessTrack );
			console.log('adding fitnessStart 2 ', fitnessTrack._id, fitnessStart.location );
			FitnessTracks.update(fitnessTrack._id,{$set:{fitStart: fitnessStart.location}});
			var fitnessTrack = FitnessTracks.findOne(fitnessTrack._id,{sort: {created: -1}});
			Session.set('fitnessTrack', fitnessTrack);
			if (!geoId)
				geoId = {};
			UserPlaces.insert(
				{
					userId: userId,
					location: location,
					started:  moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
					timestamp: timestamp,
					geoId: geoId._id,
					location: geoId.location,
					location_id: geoId.location_id,
					status: 'fitness',
					fitnessId: Session.get('fitActivity')
				}
			);
		}
	}

	if (Session.get('driving')){
		console.log('driveTrack ', Session.get('driveTrack'));
		if (!Session.get('driveTrack')) {
			DriveTracks.insert({userId: userId, activityId: Session.get('driveActivity'), timestamp: moment().valueOf(), created: new Date()});
		}		
		Drives.insert({
			location: location,
			uuid: Meteor.uuid(),
			device: device,
			userId: Meteor.userId(),
			created: new Date(),
			interval: Session.get('interval'),
			driveTrackId: Session.get('driveTrack')._id,		
		});		
		if (!Session.get('driveTrack').driveStart) {	
			console.log('adding driveStart ');
			var driveTrack = Session.get('driveTrack');
			var driveStart = Drives.findOne({driveTrackId:driveTrack._id},{sort: {created: -1}});
			console.log('adding driveStart 2 ', driveTrack._id, driveStart.location );
			DriveTracks.update(driveTrack._id,{$set:{driveStart: driveStart.location}});
			var driveTrack = DriveTracks.findOne(driveTrack._id,{sort: {created: -1}});
			Session.set('driveTrack', driveTrack);
		}
	}	
	
	if (!Session.get('fitness') && !Session.get('driving')){
	
		console.log(' adding to geolog ', location);
		var status;
/* 		if (location.coords.speed > 1)
			status = 'moving'; */
		var geoId = GeoLog.insert({
			location: location,
			uuid: uuid,
			device: device,
			userId: userId,
			created: new Date(),
			timestamp: moment().valueOf(),
			interval: Session.get('interval'),
			status: status
		});	
		addPlace(geoId, location);
		submitCoords(userId, geoId, location );
	}
	
};

findClaimed = function(userId, coords){
	var radius_search = 0.001;
	var latup = parseFloat(coords.latitude) + radius_search;
	var latdown = parseFloat(coords.latitude) - radius_search;
	var lngup = parseFloat(coords.longitude) + radius_search;
	var lngdown = parseFloat(coords.longitude) - radius_search;

//		lat2 = lat2.toString()
	var claimed = ClaimedPlaces.findOne({'coords.latitude': { $gt: latdown, $lt: latup }, 'coords.longitude': { $gt: lngdown, $lt: lngup }});
//	console.log('check claimed ', latup, latdown, lngup, lngdown, claimed);
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

updateEmptyPlaces = function(){
	console.log('updateEmptyPlaces function 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
	if ((moment().valueOf() - Session.get('updatePlaces') < 50000)) 
		return;
	var initiator = 'updateEmptyPlaces function';
	Session.set('updatePlaces', moment().valueOf());
	Meteor.call('updatePlaces', Meteor.userId(), initiator, function(err, results) {
		console.log('updatePlaces call  ', Meteor.userId(), this.location, this, results);
		Meteor.setTimeout(function(){
			Session.set('updatePlaces', false);
		}, 60000);	
		return results;
	});
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