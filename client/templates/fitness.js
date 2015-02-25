checkDistance = function(fitnessTrackId){
	var distance = 0;
	var calories = 0;
	fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
//	console.log('distance fitnessTrack ', fitnessTrack);
	if (fitnessTrack.distance) {
		return fitnessTrack.distance;
	}
	var cursor = Tracks.find({fitnessTrackId: fitnessTrackId});
//	console.log ('checking distance for 1 ', fitnessTrackId, cursor.location, cursor.fetch());
	cursor.forEach(function(item, index, array){
		var location = item.location;
		distance = distance + item.location.distance;
		distance = truncateDecimals(distance, 3);
//			console.log ('checking distance 2 for each ', location, item.location.distance, distance);
	});
	FitnessTracks.update(fitnessTrackId,{$set:{distance: distance}});
	return fitnessTrack.distance;
}

checkCalories = function(fitnessTrackId){
	var distance = 0;
	var calories = 0;
	fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
//	console.log('calories fitnessTrack ', fitnessTrack);
	if (fitnessTrack.calories > 0)
		return fitnessTrack.calories;

	var track = Tracks.find({fitnessTrackId: fitnessTrackId}, {sort:{ 'location.timestamp': 1}});
//	console.log ('checking distance for 1 ', fitnessTrackId, track.fetch());
	track = track.fetch();
	var oldLoc;
	var totCalories = 0;
	var totDistance = 0;
	track.forEach(function(item, index, array){
		if (oldLoc)  {
//			console.log(item.location);
//			console.log(oldLoc.location);
			var distance = calculateDistance(item.location.coords.latitude, item.location.coords.longitude, oldLoc.location.coords.latitude, oldLoc.location.coords.longitude);
			totDistance = totDistance + distance;
			var timediff = (item.location.timestamp - oldLoc.location.timestamp);
			if (!distance) 
				distance = 0;
			var calories = calculateCalories(item.activityId, distance, timediff);
//			console.log('checking calories inside ', item.activityId, distance, timediff, calories);
			totCalories =  totCalories + parseFloat(calories);
		}
		oldLoc = item;
//			distance = truncateDecimals(distance, 3);
//		console.log ('checking calories 2 for each ', item.location, totDistance, totCalories);
	});
//	console.log ('upserting calories  ', fitnessTrackId, totDistance, totCalories);
	totCalories = Math.round(totCalories);
	totDistance = Math.round(totDistance * 100) / 100;
	FitnessTracks.update(fitnessTrackId,{$set:{calories: totCalories, distance: totDistance}});
	return calories;
 }

Template.fitness.helpers({

	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	},
	mytypes: function(){
		var myTypes = Places.find({},{fields:{types:1}});
//		console.log(' types ', myTypes.fetch());
		myTypes.forEach(function (item, index, array) {
//			console.log(' foreach ', item.types );
			item.types.forEach(function (item2, index, array) {

				var myId = Services.findOne({type:item2});
//				console.log(' foreach ', item2, myId );
				if (!myId._id) {
//					console.log(' inserting ', item2 );
					Services.insert({type:item2});
				}
			});
		});
		return Services.find({});
	},
	status: function() {
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
});

Template.routes.helpers({
	debug: function () {
		return Session.get('debug');
	},
	ifFindFit: function () {
		console.log(' findfit ', Session.get('findfit'));

		return Session.get('findfit');
	},
	ifFitness: function () {
//		console.log(' findfit ', Session.get('findfit'));
		return Session.get('fitness');
	},
	fitActivity: function(){
		return Session.get('fitActivity')
	},
	activities: function(){
		var fitActivity = Session.get('fitActivity');
		
		var activities = FitnessActivities.find(
		{},
		{transform: function(doc){
			if (doc._id == fitActivity) 
				doc.selected = true;
			return doc;
		}}
		);
		console.log(' activities ', fitActivity, activities.fetch());
		return activities;
	},
	ifUser: function (){
		userId = Meteor.userId();
		if (!Session.get('userLocation')) {
			place = UserPlaces.findOne({userId: userId},{sort: {timestamp: -1}});
			// if (place)
				// Session.set('userLocation', place);
		}
		if (Meteor.userId()) {return 'true'};
	},
	
	track: function(){
//		console.log(' track fitness fitnessTrack ', Session.get('fitnessTrack'));
/* 		if (!Session.get('fitnessTrackId')){
			var fitnessTrackId = FitnessTracks.findOne({userId:Meteor.userId()},{sort:{created: -1}, limit: 1, fields:{_id:1}});
			console.log(' track fitness last ', fitnessTrackId);
			Session.set('fitnessTrackId', fitnessTrackId);
		} */ 
		if (!Session.get('fitnessTrackId'))
			return;
		
		var track = Tracks.find({userId: Meteor.userId(), fitnessTrackId: Session.get('fitnessTrackId') }, {
			sort: {created: -1}, limit:10,
			transform: function(doc){	
				doc.time = moment(doc.timestamp).format("hh:mm:ss");
				if (!doc.location.coords.speed)
					doc.location.distance = 0;
				console.log('checking calories', doc.calories, doc.location.distance, doc.location.speed, doc);
//					doc.location.distance = truncateDecimals(doc.location.distance, 3);
//					doc.location.coords.speed = truncateDecimals(doc.location.coords.speed, 2);
				return doc;
			}
		});
		Session.set('lastTrack', track);
		track.fitnessTrackId = Session.get('fitnessTrackId');
//			console.log(' track fitness ', track);
		return track;
		
	},
	userTracks: function(){
		var userTracks = FitnessTracks.find(
			{userId: Meteor.userId()},{
				sort:{timestamp: -1},
				transform: function(doc){
					doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm");
					doc.duration = moment.duration(doc.timestampEnd - doc.timestamp).humanize();
					doc.dur_sec = doc.timestampEnd - doc.timestamp;
					if (doc.dur_sec > 60000) {
						doc.show = true;
						if ((!doc.calories) || (doc.calories == 0))
							checkCalories(doc._id);
					}
					return doc;
				}
			}
		);
		return userTracks;
	},
	fitnessTrack: function(){
		var fitnessTrack = FitnessTracks.findOne({fitnessTrackId: this._id});
		if ((!fitnessTrack.calories) || (fitnessTrack.calories == 0))
			checkCalories(fitnessTrackId);
		return fitnessTrack;
	},
	trackActivity: function(){
		var activity = FitnessActivities.findOne(this.activityId);
		console.log(' trackActivity ', this.activityId, this, activity);
		return activity;
	},
});

Template.routes.events({
	"click .findfit": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('findfit', true);
		return;
	},
	"click .juststart": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('findfit', true);
		return;
	},
	"click .startfit": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		if (!Session.get('fitActivity')) {
			alert('please select activity first');
			return;
		}
		if (Session.get('watchGPS')) {
			Meteor.clearInterval(Session.get('watchGPS'));
			Session.set('watchGPS', false);
		}
		var userId = Meteor.userId();
		var timestamp = moment().valueOf();
		var created = moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
		var fitnessTrackId = FitnessTracks.insert({userId: userId, activityId: Session.get('fitActivity'), timestamp: timestamp, created: created});
		var fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
		// and finalise userPlace since we are in fitness now
		var userPlace = UserPlaces.findOne({userId: userId}, {sort:{timestamp: -1}});
		if (userPlace)
			if (!userPlace.timestampEnd)
				UserPlaces.update(userPlace._id, {$set:{timestampEnd:timestamp}});

		Session.set('fitnessTrackId', fitnessTrackId);
		Session.set('fitness', true);
		Session.set('findfit', false);
		Session.set('geoback', true );
		Session.set('interval', 10000);
		UpdateGeo();
		PollingGeo();
		console.log(' click startfit ', fitnessTrackId);
		// update userPlace with fitness session
		return;
	},
	"click .stopfit": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var userId = Meteor.userId();
		if (Session.get('watchGPS')) {
			Meteor.clearInterval(Session.get('watchGPS'));
			Session.set('watchGPS', false);
		}
		var fitnessTrackId = Session.get('fitnessTrackId');
		var timestampEnd = moment().valueOf();
		FitnessTracks.update(fitnessTrackId,{$set:{timestampEnd: timestampEnd}});
		var geoLoc = Tracks.findOne({fitnessTrackId: fitnessTrackId},{sort: {timestamp:1}});
/* 		var geolog = GeoLog.findOne({fitnessTrackId: fitnessTrack._id});
		GeoLog.update(geolog._id,{$set:{fitness: 'end'}}); */
		console.log('stopfit ', fitnessTrackId, geoLoc);
		var userPlaceId = UserPlaces.insert({
			userId: userId,
			location: geoLoc.location,
			started:  moment(geoLoc.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
			timestamp:  geoLoc.timestamp,
			timestampEnd: timestampEnd,
			status: 'fitness',
			fitnessId: fitnessTrackId,
			origin: 'stopfit'
		});
		
		Session.set('fitness', false);
		Session.set('fitActivity', false);
		Session.set('interval', 1000000);
		UpdateGeo();
		PollingGeo();
		
		console.log('stopfit userPlaceId ', userPlaceId, 'fitnessTrackId', fitnessTrackId);
		return;
	},
	"click .fitActivity": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
//		var fitActivity = template.find('.fitActivity').id;
		var fitActivity = $(event.target).attr('id');
		console.log('click .fitActivity ',  fitActivity, $(event.target));
		Session.set('fitActivity', fitActivity);
		return;
	},
	'click .showMap': function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		//		var fitActivity = template.find('.fitActivity').id;
		var fitnessTrackId = $(event.currentTarget).attr('id');
		console.log('click .showMap ',  fitnessTrackId, $(event.currentTarget));
		Session.set('fitnessTrackId', fitnessTrackId);
		Overlay.show('showMapFit');	
		return;
	},
});

Template.fitness.rendered = function() {
//	Session.set('findfit', false);
  var $item = $(this.find('.findroute'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
}

Template.showMapFit.helpers({
	debug: function () {
		return Session.get('debug');
	},
	track: function () {
		console.log(' track fitnessTrackId ', Session.get('fitnessTrackId'));
		var fitnessTrackId = Session.get('fitnessTrackId');
		var track = Tracks.find({fitnessTrackId:fitnessTrackId},
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
	fitnessTrack: function(){
		var fitnessTrackId = Session.get('fitnessTrackId');
		var track = FitnessTracks.findOne(fitnessTrackId,{
			transform: function(doc){
				// console.log('timespent 1 ', doc);
				// console.log('timespent 2 ', doc.timestampEnd);
				// console.log('timespent 3 ', doc.timestamp);
				doc.timespent = doc.timestampEnd - doc.timestamp;
				// console.log('timespent 4 ', doc.timespent);
				doc.timespent = moment.duration(doc.timespent).humanize();
				if ((!doc.calories) || (!doc.calories == 0))
					checkCalories(doc._id);
				doc.distance = truncateDecimals(doc.distance, 3);
				return doc;
			}
		});
		return track;
	},
  fitnessMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
			console.log('GoogleMaps loaded');
//			GoogleMaps.initialize();
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('fitnessMap', function(map) {
				
        // Add a marker to the map once it's ready
				var track = Tracks.find({fitnessTrackId:Session.get('fitnessTrackId')},
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
				var activity = FitnessActivities.findOne({_id: mytrack[0].activityId});
				activity = activity.activity;
				var oldLocation;
				track.forEach(function (item, index, array) {
					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(item.location.coords.latitude,item.location.coords.longitude),
						map: map.instance,
						title: 'Speed: ' + item.location.coords.speed 
					});	
					if (Session.get('debug'))
						console.log ('adding marker ', marker);
				});

      });
			var fitnessTrackId = Session.get('fitnessTrackId');
			var fitnessTrack = FitnessTracks.findOne(fitnessTrackId);		
			var trackStart = Tracks.findOne({fitnessTrackId:fitnessTrackId}, {sort: {timestamp: -1}});
      // Map initialization options
      return {
        center: new google.maps.LatLng(trackStart.location.coords.latitude, trackStart.location.coords.longitude),
        zoom: 18
      };
    } else {
			console.log('GoogleMaps not yet loaded');
			GoogleMaps.load();
//			GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA' });
			
		}
  }
});