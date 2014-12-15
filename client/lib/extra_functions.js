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
		insertPlace(userId, lastLoc, currentPlaceAlt);
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

insertPlace = function(userId, lastLoc, currentPlaceAlt){
	var experience, location, place, userplace;
	console.log('User was stationary enough at ', currentPlaceAlt.place_id, currentPlaceAlt.name);
	place = Places.findOne({place_id: currentPlaceAlt.place_id});
	if (!place) {					
		Places.insert(
			currentPlaceAlt
		);			
		place = Places.findOne({place_id: currentPlaceAlt.place_id});
	}
	//dding new stationary place to UserPlaces - LifeLog
	location = lastLoc.location;
	UserPlaces.insert(
		{
			placesId: place._id,
			userId: userId,
			place_id: currentPlaceAlt.place_id,
			started: new Date(),
			timestamp: lastLoc.timestamp,
			geoId: lastLoc._id,
			location: lastLoc.location,
			location_id: lastLoc.location_id,
		}
	);
	userplace = UserPlaces.findOne({userId:userId, geoId: lastLoc._id});
	if (userplace)
		location.userplaceId = userplace._id;
	location.location_id = lastLoc.location_id;
	if (userplace.confirmed)
		location.status = 'confirmed';
	if (userplace.travel)
		location.status = 'travel';
	location.place_id = currentPlaceAlt.place_id;
	Meteor.call('submitPlace', userId, location, experience);
	return true;
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
				console.log('Polling geo 2 cordova ', myInterval, Session.get('geoback'));
				UpdateGeoCordova();
			} else {
				console.log('Polling geo 2 browser ', myInterval, Session.get('geoback'));
				UpdateGeo();
			}
		}
		var watchGPS = Meteor.setInterval(runGeo, myInterval);
		Session.set('watchGPS', watchGPS);
	} else {
		console.log('Cleaning interval ', myInterval, Session.get('geoback'), Session.get('watchGPS'));		
		Meteor.clearInterval(Session.get('watchGPS'));
	}
}

addPlace = function (location){
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

	//Lets add check for non-significant coords changes in here	
	// check come here!
		
	//we have coords, lets check google
	Meteor.call('getGLoc', userId, location, radius, function(err,results){
		console.log('getGLoc call  ', results);
				
		if (!results)
			return;
		currentPlace = results.results[0];
		currentPlaceAlt = results.results[1];

		var geolog = GeoLog.findOne({timestamp: location.timestamp, userId: userId});
		if (!geolog)
			return;
		var geoId = geolog._id;
		// updating geolog with google details
		if (results.results[0])
			var place_id_0 = results.results[0].place_id
		if (results.results[1])
			var place_id_1 = results.results[1].place_id		
		GeoLog.upsert(
			geoId,
			{$set: 
				{
					userId: userId,
					place_id: place_id_0,
					stationary_place_id: place_id_1
				}
			}
		);
		
		oldLoc = GeoLog.findOne({userId: userId, timestamp:{$ne: location.timestamp}}, {sort: {timestamp: -1}});
		if (!oldLoc)
			return;
		console.log('place from GeoLog ', oldLoc);		
		if (oldLoc) {
			// if previous stationary place_id from GeoLog is the same as new one, we are stationary
			if (oldLoc.stationary_place_id == currentPlaceAlt.place_id) {
				// updating geolog with new stationary status
				console.log('Same place ', currentPlaceAlt.place_id);
				current_status = 'stationary';
				GeoLog.upsert(geoId, {$set: {status: current_status,}});						
				// and let's check if user has spent enough time to make it userplace
				var ifThat = ifStatic(userId, currentPlace, currentPlaceAlt, location);
				
			} else {
				// if previous stationary place_id is not the same and userplace is not finalised, then finalise it, user is officially on the move
				console.log('moved ', currentPlaceAlt.place_id, ' from ',oldLoc.stationary_place_id, oldLoc );
				current_status = '';
				var userplace = UserPlaces.findOne({userId:userId},{fields:{_id:1}, sort:{timestamp: -1}});				
				if (!userplace.timestampEnd) {
					if (userplace._id){
						UserPlaces.upsert({_id: userplace._id}, {timestampEnd: oldLoc.timestamp});
						// and submit to server with the timestampEnd
						location.timestampEnd = oldLoc.timestamp;
						location.userplaceId = userplace._id;
						Meteor.call('submitPlace', userId, location, experience);
					}
					UserPlaces.insert(
					{
						geoId: geoId,
						userId: userId,
						place_id: place_id_0,
						started: new Date(),
						location: location,
						travel: true,
					});
//					console.log('User has moved from ', lastLoc.stationary_place_id, ' to ', currentPlaceAlt.place_id);
				}
				// updating geolog with new place
			}
		}

		submitCoords(userId, geoId, location );
	});

}

UpdateGeo = function (){
//	var handle = Deps.autorun(function () {
	var userId = Meteor.userId();
	var location = Geolocation.currentLocation();
	var geoId = GeoLog.findOne({timestamp: location.timestamp, userId: userId},{fields:{_id:1}});
	console.log('UpdateGeo event ', location, geoId, this);
	if (!geoId) {
		GeoLog.insert({
			location: location,
			uuid: Meteor.uuid(),
			device: 'browser',
			userId: Meteor.userId(),
			created: new Date(),
			timestamp: location.timestamp
		});
		addPlace(location);
	}
	return location;
};

UpdateGeoCordova = function(){
	var userId = Meteor.userId();
	GeolocationFG.get(function(location) {
		console.log('UpdateGeoCordova ',  location, this);
		if (location.coords.speed) {
			Session.set('interval', 50000);
		} else {
			Session.set('interval', 800000);
		}
		var geoId = GeoLog.findOne({timestamp: location.timestamp, userId: userId},{fields:{_id:1}});
		if (!geoId) {
			GeoLog.insert({
				location: location,
				uuid: GeolocationBG2.uuid(),
				device: GeolocationBG2.device(),
				userId: Meteor.userId(),
				created: new Date(),
				timestamp: location.timestamp
			});
		}
	//		Session.set('interval', 60000);
		addPlace(location);
		return location;
	});
}

findClaimed = function(userId, coords){
	var radius_search = 0.001;
	var latup = parseFloat(coords.latitude) + radius_search;
	var latdown = parseFloat(coords.latitude) - radius_search;
	var lngup = parseFloat(coords.longitude) + radius_search;
	var lngdown = parseFloat(coords.longitude) - radius_search;

//		lat2 = lat2.toString()
	var claimed = ClaimedPlaces.findOne({'coords.latitude': { $gt: latdown, $lt: latup }, 'coords.longitude': { $gt: lngdown, $lt: lngup }});
	console.log('check claimed ', latup, latdown, lngup, lngdown, claimed);
	return claimed;
}

