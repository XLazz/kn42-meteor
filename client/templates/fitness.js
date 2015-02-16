

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
		if (!FitnessActivities.findOne()) {
			var activities = ['jogging','walking','bicycling'];
			console.log('FitnessActivities empty ',  activities);
			activities.forEach(function (item, index, array) {
			console.log('FitnessActivities empty, adding item',  item);			
				FitnessActivities.insert(
					{
						activity: item,
						date: new Date
					}
				);
			});
		}
		return Session.get('findfit');
	},
	ifFitness: function () {
		console.log(' findfit ', Session.get('findfit'));
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
		if (!Session.get('fitnessTrack')){
			var fitnessTrack = FitnessTracks.findOne({userId:Meteor.userId()},{sort:{created: -1}, limit: 5});
			console.log(' track fitness last ', fitnessTrack);
			Session.set('fitnessTrack', fitnessTrack);
		} else {	
			var track = Tracks.find({userId: Meteor.userId(), fitnessTrackId: Session.get('fitnessTrack')._id }, {
				sort: {created: -1}, limit:5,
				transform: function(doc){	
					var time = doc.location.timestamp;
					time = moment(time).format("h:mm:ss");
					doc.time = time;
					if (!doc.location.coords.speed)
						doc.location.distance = 0;
					doc.location.distance = truncateDecimals(doc.location.distance, 3);
					doc.location.coords.speed = truncateDecimals(doc.location.coords.speed, 2);
					return doc;
				}
			});
			track.fitnessTrackId = Session.get('fitnessTrack')._id;
//			console.log(' track fitness ', track);
			return track;
		}
	},
	userTracks: function(){
		var userTracks = FitnessTracks.find(
			{userId: Meteor.userId()},{
				sort:{created: -1},
				transform: function(doc){
					doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm");
					doc.duration = moment.duration(doc.timestampEnd - doc.timestamp).humanize();
					doc.dur_sec = doc.timestampEnd - doc.timestamp;
					if (doc.dur_sec > 60000)
						doc.show = true;
					return doc;
				}
			}
		);
		return userTracks;
	},
	fitnessTrack: function(){
		var fitnessTrack = FitnessTracks.findOne({fitnessTrackId: this._id});
		return fitnessTrack;
	},
  distance: function(){
		var fitnessTrackId = this._id;
		var distance = 0;
		fitnessTrack = FitnessTracks.findOne(fitnessTrackId);
		console.log(' fitnessTrack ', fitnessTrack);
		if (fitnessTrack.distance) {
			return fitnessTrack.distance;
		}
		var cursor = Tracks.find({fitnessTrackId: fitnessTrackId});
		console.log ('checking distance for 1 ', fitnessTrackId, cursor.location, cursor.fetch());
		cursor.forEach(function(item, index, array){
			var location = item.location;
			distance = distance + item.location.distance;
			distance = truncateDecimals(distance, 3);
			console.log ('checking distance 2 for each ', location, item.location.distance, distance);
		});
		FitnessTracks.update(fitnessTrackId,{$set:{distance: distance}});
		return distance;
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
		FitnessTracks.insert({userId: userId, activityId: Session.get('fitActivity'), timestamp: moment().valueOf(), created: new Date()});
		var fitnessTrack = FitnessTracks.findOne({userId:Meteor.userId()},{sort: {created: -1}});
		Session.set('fitnessTrack', fitnessTrack);
		var fitActivity = Session.get('fitActivity');
		Session.set('fitActivity', fitActivity);
		Session.set('fitness', true);
		Session.set('findfit', false);
		Session.set('geoback', true );
		Session.set('interval', 10000);
		UpdateGeo();
		PollingGeo();
		console.log(' click startfit ', fitActivity);
		return;
	},
	"click .stopfit": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		if (Session.get('watchGPS')) {
			Meteor.clearInterval(Session.get('watchGPS'));
			Session.set('watchGPS', false);
		}
		Session.set('interval', 300000);
		UpdateGeo();
		PollingGeo();
		var fitnessTrack = Session.get('fitnessTrack');
		var timestampEnd = moment().valueOf();
		FitnessTracks.update(fitnessTrack._id,{$set:{timestampEnd: timestampEnd}});
/* 		var geolog = GeoLog.findOne({fitnessTrackId: fitnessTrack._id});
		GeoLog.update(geolog._id,{$set:{fitness: 'end'}}); */
		Session.set('fitness', false);
		Session.set('fitnessTrack', false);
		Session.set('fitActivity', false);
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
		var fitTrack = $(event.currentTarget).attr('id');
		console.log('click .showMap ',  fitTrack, $(event.currentTarget));
		Session.set('fitTrack', fitTrack);
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
		console.log(' track ', Session.get('fitTrack'));
		var fitTrack = Session.get('fitTrack');
		var track = Tracks.find({fitnessTrackId:fitTrack},
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
		var fitTrack = Session.get('fitTrack');
		var track = FitnessTracks.findOne(fitTrack);
		console.log('fitnessTrack track ', track);
		return track;
	},
  fitnessMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
			console.log('GoogleMaps not loaded');
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('fitnessMap', function(map) {
				console.log('GoogleMaps ready');
        // Add a marker to the map once it's ready
				var track = Tracks.find({fitnessTrackId:fitTrack},
					{
						sort: {created: -1},
						transform: function(doc){	
							doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm:ss");
							doc.location.coords.speed = Math.round(doc.location.coords.speed * 1000 / 60 / 60 * 100) / 100 
							return doc;
						}
					}
				);
				track.forEach(function (item, index, array) {
					//			console.log(' foreach ', item.types );
					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(item.location.coords.latitude,item.location.coords.longitude),
						map: map.instance,
						title: 'Speed: ' + item.location.coords.speed
					});	
				});
      });
			var fitTrack = Session.get('fitTrack');
			var trackStart = FitnessTracks.findOne(fitTrack);			
      // Map initialization options
      return {
        center: new google.maps.LatLng(trackStart.fitStart.coords.latitude, trackStart.fitStart.coords.longitude),
        zoom: 18
      };
    } else {
			GoogleMaps.load();
//			GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA' });
			console.log('GoogleMaps not yet loaded');
		}
  }
});