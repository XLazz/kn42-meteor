/* trackDistance = function(fitnessTrackId){
	var track = Tracks.find({userId: Meteor.userId(), fitnessTrackId: Session.get('fitnessTrackId') }, {
	sort: {created: -1}, 
	var old_doc;
	transform: function(doc){	
		doc.time = moment(doc.timestamp).format("hh:mm:ss");
		if (!old_doc) 
			doc.location.distance = 0;
		doc.location.distance = 
		console.log('checking calories', doc.calories, doc.location.distance, doc.location.speed, doc);
//					doc.location.distance = truncateDecimals(doc.location.distance, 3);
//					doc.location.coords.speed = truncateDecimals(doc.location.coords.speed, 2);
		old_doc = doc;
		return doc;
	}
}); */

checkDistance = function(fitnessTrackId){
	var distance = 0;
	var calories = 0;
	var old_loc;
	var i = 0;
	var fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
//	console.log('distance fitnessTrack ', fitnessTrack);
	if (fitnessTrack.distance) {
		return fitnessTrack.distance;
	}
	var cursor = Tracks.find({fitnessTrackId: fitnessTrackId});
	if (Session.get('debug'))
		console.log ('checking distance for 1 ', fitnessTrackId, cursor.count());
	cursor.forEach(function(item, index, array){
		if (old_loc) {
			if (Session.get('debug')) {
				console.log('item ', fitnessTrackId, item._id, item.location.coords, old_loc.location.coords);
			}
			location.distance = calculateDistanceLoc (item.location.coords, old_loc.location.coords);
			distance += location.distance;
			if (Session.get('debug'))
				console.log ('checking distance for 1.5 ', i, ' id ', fitnessTrackId, item._id, distance, location.distance);
		}
		old_loc = item;
		i++;
	});
	distance = Math.round(distance * 10) /10; //In metres
//	FitnessTracks.update(fitnessTrackId,{$set:{distance: distance}});
	return distance;
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
		console.log('sessions ', Session.get('findfit'), Session.get('fitActivity'), Session.get('fitness'), Session.get('selectRoute'), Session.get('findRoute'));
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
	selectRoute: function(){
		return Session.get('selectRoute');
	},
	findRoute: function(){
		return Session.get('findRoute');
	},
	readyFit: function(){
		console.log('justStart', Session.get('justStart'), 'selectRoute',  Session.get('selectRoute') , 'fitActivity',  Session.get('fitActivity'));
		if (((Session.get('justStart')) || ( Session.get('selectRoute') )) && (Session.get('fitActivity')))
			return true;
	},
	fitActivity: function(){
		return Session.get('fitActivity');
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
	noRecent: function(){
		console.log('justStart', Session.get('justStart'), 'selectRoute',  Session.get('selectRoute') , 'fitActivity',  Session.get('fitActivity'), 'findRoute', Session.get('findRoute'));
		if (Session.get('justStart') || ( Session.get('selectRoute') ) || (Session.get('fitActivity')) || (Session.get('findRoute')))
			return true;
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
					var track = Tracks.find({fitnessTrackId:doc._id});
					doc.count = track.count();
					doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm");
					doc.duration = moment.duration(doc.timestampEnd - doc.timestamp).humanize();
					doc.dur_sec = doc.timestampEnd - doc.timestamp;
					if (doc.dur_sec > 60000) {
						doc.show = true;
						if ((!doc.calories) || (doc.calories == 0))
							checkCalories(doc._id);
					}
					if (!doc.distance)
						doc.distance = checkDistance(doc._id);
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
	"click .findroute": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('justStart', false);
		Session.set('findfit', true);
		Session.set('findRoute', true);
		console.log('sessions ', Session.get('findfit'), Session.get('fitActivity'), Session.get('fitness'), Session.get('selectRoute'), Session.get('findRoute'));
		return;
	},
	"click .juststart": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('fitActivity', false);
		Session.set('justStart', true);
		Session.set('selectRoute', false);
		Session.set('findfit', true);
		Session.set('findRoute', false);
		console.log('sessions ', Session.get('findfit'), Session.get('fitActivity'), Session.get('fitness'), Session.get('selectRoute'), Session.get('findRoute'));
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
		var fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
		var timestampEnd = moment().valueOf();

		if ((timestampEnd - fitnessTrack.timestamp) > 60000) {
			// if more than 1 mins, finalise it
			FitnessTracks.update(fitnessTrackId,{$set:{timestampEnd: timestampEnd}});
//			var geoLoc = Tracks.findOne({fitnessTrackId: fitnessTrackId},{sort: {timestamp:1}});
			/* 		var geolog = GeoLog.findOne({fitnessTrackId: fitnessTrack._id});
			GeoLog.update(geolog._id,{$set:{fitness: 'end'}}); */
			console.log('stopfit ', fitnessTrackId);
			var userPlaceId = UserPlaces.insert({
				userId: userId,
				location: fitnessTrack.location,
				started:  moment(fitnessTrack.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
				timestamp:  fitnessTrack.timestamp,
				timestampEnd: timestampEnd,
				status: 'fitness',
				fitnessId: fitnessTrackId,
				origin: 'stopfit'
			});
		} else {
			// if less than 1 mins, remove
			FitnessTracks.remove(fitnessTrackId);	
		}
		
		Session.set('userPlaceId', userPlaceId);
		Session.set('justStart', false);
		Session.set('selectRoute', false);
		Session.set('fitActivity', false);
		Session.set('findRoute', false);
		Session.set('fitness', false);
		Session.set('fitActivity', false);
		Session.set('interval', 1000000);
		UpdateGeo();
		PollingGeo();
		
		console.log('stopfit userPlaceId ', userPlaceId, 'fitnessTrackId', fitnessTrackId);
		return;
	},
	'click .cancelfit': function(event, template){
		Session.set('justStart', false);
		Session.set('selectRoute', false);
		Session.set('fitActivity', false);
		Session.set('findRoute', false);
		console.log('justStart', Session.get('justStart'), 'selectRoute',  Session.get('selectRoute') , 'fitActivity',  Session.get('fitActivity'), 'findRoute', Session.get('findRoute'));
	},
	"click .fitActivity": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
//		var fitActivity = template.find('.fitActivity').id;
		var fitActivity = event.currentTarget.id;
		console.log('click .fitActivity ',  fitActivity, $(event.target));
		Session.set('fitActivity', fitActivity);
		if (!Session.get('findRoute'))
			Session.set('justStart', true);
		return;
	},
	'click .showMap': function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		//		var fitActivity = template.find('.fitActivity').id;
		var fitnessTrackId = $(event.currentTarget).attr('id');
		console.log('click .showMap ',  fitnessTrackId, $(event.currentTarget));
		if (fitnessTrackId)
			Session.set('fitnessTrackId', fitnessTrackId);
		Overlay.show('showMapFit');	
		return;
	},
});

Template.currentTrack.helpers({
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
});

Template.recentTracks.helpers({
	
	userTracks: function(){
		var fitnessTrackId = Session.get('fitnessTrackId');
		console.log('userTracks', fitnessTrackId, Meteor.userId());
		var userTracks = FitnessTracks.find(
			{
				userId: Meteor.userId()
			},{	
				sort:{timestamp: -1},
				transform: function(cursor){
					var track = Tracks.find({fitnessTrackId:cursor._id});
					cursor.count = track.count();
					cursor.date = moment(cursor.timestamp).format("MM/DD/YY HH:mm");
					cursor.duration = moment.duration(cursor.timestampEnd - cursor.timestamp).humanize();
					cursor.dur_sec = cursor.timestampEnd - cursor.timestamp;
					if (cursor.dur_sec > 60000) {
						cursor.show = true;
						if ((!cursor.calories) || (cursor.calories == 0))
						checkCalories(cursor._id);
					}
					if (!cursor.distance)
						cursor.distance = checkDistance(cursor._id);
					if (cursor._id == fitnessTrackId) 
						cursor.selected = true;
					cursor.activity = FitnessActivities.findOne(cursor.activityId,{fields: {icon:1, name:1}});
					return cursor;
				}
			}
		);
		console.log('userTracks', userTracks);
		return userTracks;
	},	
});

Template.selectRoutes.helpers({
	routes: function(){
		var selectRoute = Session.get('selectRoute');
		var routes = FitnessRoutes.find(
			{userId: Meteor.userId()
			},{
				sort:{timestamp: -1},
				transform: function(cursor){
					if (cursor.fitnessTrackId == selectRoute) 
						cursor.selected = true;
					cursor.activity = FitnessActivities.findOne(cursor.activityId,{fields: {icon:1, name:1}});
					return cursor;	
				}
			}
		);
		console.log('selectRoutes 2 ', routes.fetch());
		return routes;
	},		
	ifRoutes: function(){
		var routes = FitnessRoutes.findOne(	{userId: Meteor.userId()});
		return routes;
	},	
});

Template.selectRoutes.events({
	'click .showMap': function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		//		var fitActivity = template.find('.fitActivity').id;
		var fitnessTrackId = event.delegateTarget.id;
		console.log('click .showMap ',  fitnessTrackId, event.delegateTarget.id, event.target.id, event.currentTarget.id);
		if (fitnessTrackId)
			Session.set('fitnessTrackId', fitnessTrackId);
		Overlay.show('showMapFit');	
		return;
	},	
	'click .setfitnessTrackId': function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		//		var fitActivity = template.find('.fitActivity').id
		var fitnessTrackId = event.currentTarget.id;
		console.log('click .setfitnessTrackId ',  fitnessTrackId, event.delegateTarget.id, event.target.id, event.currentTarget.id);
		if (fitnessTrackId)
			Session.set('fitnessTrackId', fitnessTrackId);
		return;
	},	
	"click .selectroute": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('selectroute', event.currentTarget.id, event.currentTarget);
		Session.set('selectRoute', event.currentTarget.id);
		Session.set('findfit', true);
		Session.set('findRoute', true);
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
				doc.date = moment(doc.timestamp).format("YYYY/MM/DD");
				return doc;
			}
		});
		var fitnessRoute = FitnessRoutes.findOne({fitnessTrackId:track._id});
		if (fitnessRoute) {
			track.fitnessRouteId = fitnessRoute._id;
			track.publicRoute = fitnessRoute.publicRoute;
			track.name = fitnessRoute.name;
		}
		console.log(' fitnessTrack', fitnessTrackId, fitnessRoute, track, this);
		return track;
	},
	fitnessRoute: function() {
		
		var fitnessRoute = FitnessRoutes.findOne({fitnessTrackId:Session.get('fitnessTrackId')});
		console.log('fitnessRoute', this._id, this, fitnessRoute);
		return fitnessRoute;
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

				var lineCoordinates = [];
				track.forEach(function (item, index, array) {
					lineCoordinates.push (new google.maps.LatLng(item.location.coords.latitude, item.location.coords.longitude));
				});
				//first place
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(mytrack[0].location.coords.latitude,mytrack[0].location.coords.longitude),
					map: map.instance,
				});	
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

Template.showMapFit.events({
  'submit form': function(event) {
//    event.preventDefault();
  },
});