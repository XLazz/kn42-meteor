checkDistanceDrive = function(driveTrackId){
	var distance = 0;
	var calories = 0;
	var old_loc;
	var i = 0;
	var fitnessTrack = DriveTracks.findOne(driveTrackId);
//	console.log('distance fitnessTrack ', fitnessTrack);
/* 	if (fitnessTrack.distance) {
		return fitnessTrack.distance;
	} */
	var cursor = Drives.find({driveTrackId: driveTrackId});
	if (Session.get('debug'))
		console.log ('checking distance for 1 ', driveTrackId, cursor.count());
	cursor.forEach(function(item, index, array){
		if (old_loc) {
			if (Session.get('debug')) {
				console.log('item ', driveTrackId, item._id, item.location.coords, old_loc.location.coords);
			}
			location.distance = calculateDistanceLoc (item.location.coords, old_loc.location.coords);
			distance += location.distance;
			if (Session.get('debug'))
				console.log ('checking distance for 1.5 ', i, ' id ', driveTrackId, item._id, distance, location.distance);
		}
		old_loc = item;
		i++;
	});
	distance = Math.round(distance * 10 / 1000) /10; //make it in km
	DriveTracks.update(driveTrackId,{$set:{distance: distance}});
	return distance;
}

Template.autolog.helpers({

	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	}
});

Template.driving.helpers({
	ifDriving: function () {
		console.log(' driving ', Session.get('driving'));
		return Session.get('driving');
	},
	ifUser: function (){
		if (Meteor.userId()) 
			return 'true';
	},
	
	drive: function(){
		if (!Session.get('driveTrackId'))
			return;
		
		var track = Drives.find({userId: Meteor.userId(), driveTrackId: Session.get('driveTrackId') }, {
			sort: {created: -1}, limit:10,
			transform: function(doc){	
				doc.time = moment(doc.timestamp).format("hh:mm:ss");
				if (!doc.location.coords.speed)
					doc.location.distance = 0;
				if (doc.location.coords.speed) {
					doc.speed = Math.round(doc.location.coords.speed * 10)/10;
					doc.speedKm = Math.round(doc.location.coords.speed * 1000 * 10)/60/60/10;
				}
				return doc;
			}
		});
//		Session.set('lastTrack', track);
		track.driveTrackId = Session.get('driveTrackId');
		//			console.log(' track fitness ', track);
		return track;
	},
	userDrives: function(){
		var userDrives = DriveTracks.find(
			{userId: Meteor.userId()},{
				sort:{timestamp: -1},
				transform: function(doc){
					var drive = Drives.find({driveTrackId:doc._id});
					doc.count = drive.count();
					doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm");
					doc.duration = moment.duration(doc.timestampEnd - doc.timestamp).humanize();
					doc.dur_sec = doc.timestampEnd - doc.timestamp;		
					return doc;
				}
			}
		);
		return userDrives;
	},
	driveTrack: function(){
		console.log('driveTrackId ', this._id);
		var cursor = Drives.find({driveTrackId:this._id});
		var driveTrack = DriveTracks.findOne(this._id);
		
		driveTrack.count = cursor.count();
		return driveTrack;
	},
	
  distance: function(){
		return checkDistanceDrive(this._id);
	}
});

Template.driving.events({
	"click .startdriving": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		if (Session.get('watchGPS')) {
			Meteor.clearInterval(Session.get('watchGPS'));
			Session.set('watchGPS', false);
		}
		var userId = Meteor.userId();
		var timestamp = moment().valueOf();
		var created = moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
		var driveTrackId = DriveTracks.insert({userId: userId, timestamp: timestamp, created: created});
		var driveTrack = DriveTracks.findOne(driveTrackId);
		// and finalise userPlace since we are in fitness now
		var userPlace = UserPlaces.findOne({userId: userId}, {sort:{timestamp: -1}});
		if (userPlace)
			if (!userPlace.timestampEnd)
				UserPlaces.update(userPlace._id, {$set:{timestampEnd:timestamp}});
		
		Session.set('driveTrackId', driveTrackId);
		Session.set('driving', true);
		Session.set('geoback', true );
		Session.set('interval', 10000);
		UpdateGeo();
		PollingGeo();
		console.log(' click startdriving ', driveTrackId);
		return;
	},
	"click .stopdriving": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var userId = Meteor.userId();
		if (Session.get('watchGPS')) {
			Meteor.clearInterval(Session.get('watchGPS'));
			Session.set('watchGPS', false);
		}
		var driveTrackId = Session.get('driveTrackId');
		var driveTrack = DriveTracks.findOne(driveTrackId);
		var timestampEnd = moment().valueOf();

		if ((timestampEnd - driveTrack.timestamp) > 300000) {
			DriveTracks.update(driveTrackId,{$set:{timestampEnd: timestampEnd}});
//			var geoLoc = Drives.findOne({driveTrackId: driveTrackId},{sort: {timestamp:1}});
			/* 		var geolog = GeoLog.findOne({fitnessTrackId: fitnessTrack._id});
			GeoLog.update(geolog._id,{$set:{fitness: 'end'}}); */
			console.log('stopfit ', driveTrackId, driveTrack);
			var userPlaceId = UserPlaces.insert({
				userId: userId,
				location: driveTrack.location,
				started:  moment(driveTrack.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
				timestamp:  driveTrack.timestamp,
				timestampEnd: timestampEnd,
				status: 'driving',
				fitnessId: driveTrackId,
				origin: 'stopdriving'
			});
		} else {
			DriveTracks.remove(driveTrackId);
		}
		Session.set('userPlaceId', userPlaceId);
		Session.set('driving', false);
		Session.set('interval', 1000000);
		UpdateGeo();
		PollingGeo();
		
		console.log('stopfit userPlaceId ', userPlaceId, 'driveTrackId', driveTrackId);
		return;

	},
	'click .showMap': function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		//		var fitActivity = template.find('.fitActivity').id;
		var driveTrackId = $(event.currentTarget).attr('id');
		console.log('click .showMap ',  driveTrackId, $(event.currentTarget));
		Session.set('driveTrackId', driveTrackId);
		Overlay.show('showMapDrv');	
		return;
	},
});

/* Template.autolog.rendered = function() {
//	Session.set('findfit', false);
  var $item = $(this.find('.findroute'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
} */

Template.showMapDrv.helpers({
	debug: function () {
		return Session.get('debug');
	},
	track: function () {
		console.log(' drive  ', Session.get('driveTrackId'));
		var driveTrackId = Session.get('driveTrackId');
		var track = Drives.find({driveTrackId:driveTrackId},
			{
				sort: {created: -1},
				transform: function(doc){	
					doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm:ss");
					doc.location.coords.speed = Math.round(doc.location.coords.speed * 1000 / 60 / 60 * 100) / 100 
					return doc;
				}
			}
		);		
		return track;
	},
	driveTrack: function(){
		var driveTrackId = Session.get('driveTrackId');
		var track = DriveTracks.findOne(driveTrackId);
		console.log('drvTrack track ', track);
		return track;
	},
  driveMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('driveMap', function(map) {
        // Add a marker to the map once it's ready
				var track = Drives.find({driveTrackId:Session.get('driveTrackId')},
					{
						sort: {'created': 1},
						transform: function(doc){	
							doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm:ss");
							doc.location.coords.speed = Math.round(doc.location.coords.speed * 1000 / 60 / 60 * 100) / 100 
							return doc;
						}
					}
				);
				if (Session.get('debug'))
					console.log('GoogleMaps ready loading markers ', track.fetch(), this);
				var mytrack = track.fetch();
//				console.log ('track ', mytrack);
//				console.log ('track ', mytrack[0].activityId);
				var oldLocation;
				var lineCoordinates = [];
				track.forEach(function (item, index, array) {
/* 					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(item.location.coords.latitude,item.location.coords.longitude),
						map: map.instance,
						title: 'Speed: ' + item.location.coords.speed 
					});	 */
					lineCoordinates.push (new google.maps.LatLng(item.location.coords.latitude, item.location.coords.longitude));
					if (Session.get('debug'))
						console.log ('adding marker ', lineCoordinates);
					var line = new google.maps.Polyline({
						path: lineCoordinates,
						geodesic: true,
						strokeColor: '#FF0000',
						strokeOpacity: 1.0,
						strokeWeight: 2,
						map: map.instance
					});
				});


				
      });
//			var driveTrack = FitnessTracks.findOne(driveTrackId);		
			var driveStart = Drives.findOne({driveTrackId:Session.get('driveTrackId')}, {sort: {timestamp: -1}});
      // Map initialization options
      return {
        center: new google.maps.LatLng(driveStart.location.coords.latitude, driveStart.location.coords.longitude),
        zoom: 18
      };
    } else {
			console.log('GoogleMaps not yet loaded');
			GoogleMaps.load();
			//			GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA' });
			
		}
  }
});