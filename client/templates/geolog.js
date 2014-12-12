Meteor.subscribe('basic');

Session.set('location', Geolocation.currentLocation());
var location = {};

submitCoords = function(userId, geoId, location ){
	Meteor.call('submitCoords',  userId, location.timestamp, location.coords, function(err,results){
		console.log('submitCoords to php, gor results ', userId,  results);
		console.log('submitCoords to php, gor results ', userId, ' results.location_id ', results.location_id, ' coords ', location.coords, ' geoId ', geoId);			
		GeoLog.upsert(
			{_id: geoId},
			{$set: {location_id: results.location_id}}
		);
	});
}

ifStatic = function(userId, currentPlace, currentPlaceAlt, timestamp){
	var upsert_it;
	timestamp = moment().valueOf() - 600;
	var lastLoc = GeoLog.findOne({timestamp: {$lt: timestamp}, userId: userId});
	if (!lastLoc)
		return;
	console.log('lastLoc if user has moved from ', lastLoc.stationary_place_id);
	var myId = UserPlaces.findOne({userId: userId}, {sort: {started: -1}});
	if (lastLoc.stationary_place_id !== currentPlaceAlt.place_id) {
		console.log('User has moved from ', lastLoc.stationary_place_id, ' to ', currentPlaceAlt.place_id);
		// Add finished
		if (myId) {
			if (!myId.timestampEnd) {
				UserPlaces.upsert({_id: myId._id}, {timestampEnd: lastLoc.timestamp});
			}
		}
	} else {
		//since user static for 600, let;s add UserPlace
		console.log('User stationary ', lastLoc.stationary_place_id);
		currentPlace.timestamp = lastLoc.timestamp;
		currentPlace.geoId = lastLoc._id
		
		if (!myId) {
			upsert_it = 1;
		} else {
			if (myId.place_id !== currentPlaceAlt.place_id){
				upsert_it = 1;
			}
		}
		if (upsert_it) {
			console.log('User was stationary for 600 at ', currentPlaceAlt.place_id, currentPlaceAlt.name);
			var place = Places.findOne({place_id: currentPlaceAlt.place_id});
			if (!place) {
				Places.upsert(
					{place_id:  currentPlaceAlt.place_id},
					currentPlaceAlt
				);			
				place = Places.findOne({place_id: currentPlaceAlt.place_id});
			}
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
			return true;
		}
	}
	
//		alert ('moved');
	
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

upsertPlaceId = function (location){
	userId =  Meteor.userId();
	var radius = 30; //stationary and google search radius
	var results;
	var currentPlace;
	var current_status;
	var geoId = GeoLog.findOne({timestamp: location.timestamp, userId: userId})._id;
	if (location){
//	 if (location.speed){
		Meteor.call('getGLoc', userId, location, radius, function(err,results){
			console.log('getGLoc call  ', results);
					
			if (!results)
				return;
			currentPlace = results.results[0];
			currentPlaceAlt = results.results[1];
			
			oldPlace = GeoLog.findOne({userId: userId, timestamp:{$ne: location.timestamp}}, {sort: {timestamp: -1}});
			console.log('place from Gcall ', oldPlace);		
			if (oldPlace) {
				if (oldPlace.stationary_place_id == currentPlaceAlt.place_id) {
					console.log('Same place ', currentPlaceAlt.place_id);
					current_status = 'stationary';
					

					// and let's replace the address with place
				} else {
					console.log('moved ', currentPlaceAlt.place_id, ' from ',oldPlace.stationary_place_id, oldPlace );
					current_status = '';

					// updating geolog with new place
				}
			}
			GeoLog.upsert(
				{_id: geoId},
				{$set: 
					{
						place_id: results.results[0].place_id,
						stationary_place_id: results.results[1].place_id,
						status: current_status,
					}
				}
			)
			var ifThat = ifStatic(userId, currentPlace, currentPlaceAlt, location.timestamp);
			submitCoords(userId, geoId, location );
		});
	}
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
		upsertPlaceId(location);
	}
	

	return location;
};

UpdateGeoCordova = function(){
	var userId = Meteor.userId();
	GeolocationFG.get(function(location) {
		console.log('UpdateGeoCordova ',  location, this);
		if (location.coords.speed) {
			Session.set('interval', 150000);
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
		upsertPlaceId(location);
		return location;
	});
}

Template.geolog.helpers({
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
});

Template.coords.helpers({

	geologs: function(){
		return GeoLog.find({}, {sort: {timestamp: -1}, 
			transform: function(doc){	
				if (doc.confirmed)
					doc.place_id = doc.confirmed;
				return doc;
			}
		});
	},

	geoPlace: function() {
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = Places.findOne({place_id: this.place_id});
//		console.log('geoPlace ', this.place_id);
		return place;
	},
	geoMerchant: function() {
		var userId = Meteor.userId();
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		if (!place) {
			var radius = 50;
			Meteor.call('getGLoc', userId, this, radius, function(err, results) {
				console.log('getGLoc call in geoMerchant ', userId, this, results);
				return results;
			});
		}
//		console.log('geoMerchant ', this.place_id);
		return place;
	},
});


	
Template.footergeo.helpers({
	userId: function(){
		return Meteor.userId();
	},
	status: function(){
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
	isChecked: function(){
		console.log('isChecked ', Session.get('debug'));
		return Session.get('debug');
	},
	
	button: function(){
		if (Session.get('geoback')){
			return 'Stop';		
		} else {
			return 'Start';
		}
	}
});

Template.footergeo.events({
	
	'click #getNow': function() {
//		UpdateGeo();
		var location =  Geolocation.currentLocation();
		console.log('click #getNow general event ', location, this);
		if (Meteor.isCordova) {
			// cordova
			UpdateGeoCordova();
			return;
		}
		// browser
		UpdateGeo();
	},
	'click #getBackground': function(event) {
		console.log('Geolocation.getBackground browser event check ', location, Session.get('geoback'), this);
		var btn = event.currentTarget;
		var dest = document.getElementById('btnFeedback');
		if (!Meteor.isCordova) {
//			return;	
			if (Session.get('geoback') != true) {
				console.log('Geolocation.getBackground browser event set true ', location, Session.get('geoback'), this);
//				dest.innerHTML = 'Started';
				btn.innerHTML = 'Stop';
				Session.set('geoback', true);
				Session.set('interval', 300000);
				UpdateGeo();
				PollingGeo();
				return;
			}
			console.log('Geolocation.getBackground browser event set false ', location, Session.get('geoback'), this);
//			dest.innerHTML = 'Stopped';
			btn.innerHTML = 'Start';
			Session.set('geoback', false);
			PollingGeo();
			return;
		}
/////////////////////////
		if (!Session.get('geoback')){
			btn.innerHTML = 'Start';
			Session.set('geoback', true);
			Meteor.user.update({'profile.geoback': true});
			Session.set('interval', 500000);
			PollingGeo();
			return;	
		} else {
			btn.innerHTML = 'Stop';
			Session.set('geoback', false);
			Meteor.user.update({'profile.geoback': ''});
			Session.set('interval', 5000000);
			PollingGeo();
			return;
		}
/* 		if (!GeolocationBG2.isStarted) {
			if (!GeolocationBG2.start()) {
				dest.innerHTML = 'ERROR: Not Started, unable to start';
				return;
			}
			if (!GeolocationBG2.isStarted) {
				dest.innerHTML = 'ERROR: Not Started, status = false';
				return;
			}
//			dest.innerHTML = 'Started (every few minutes there should be an update)';
			btn.innerHTML = 'Stop';
			Session.set('geoback', true);
			Session.set('interval', 300000);
			UpdateGeoCordova();
			PollingGeo();
			console.log('Geolocation.getBackground cordova event set true ', Session.get('interval'), Session.get('geoback'), this);
			return;
		}
		if (!GeolocationBG2.stop()) {
			dest.innerHTML = 'ERROR: Not Stopped, unable to stop';
			return;
		}
		if (GeolocationBG2.isStarted) {
			dest.innerHTML = 'ERROR: Not Stopped, status = true';
			return;
		}
	//	dest.innerHTML = 'Stopped';
		btn.innerHTML = 'Start';
		Session.set('geoback', false);
		Session.set('interval', 5000000);
		PollingGeo();
		return;
 */	},
	
	"click .deletedata": function (event, template) {
		console.log('delete geodata events ');
		Meteor.call('deleteGeoData', Meteor.userId());
//		Meteor.call('getLocations','list',function(err,results));
	},	



});

if (Meteor.isCordova) {
  GeolocationBG2.config({
    url: 'http://kn42.xlazz.com:3000/api/geolocation',
    debug: Session.get('debug'),
  });
  // triggered by a start button
  // GeolocationBG2.start();
}


