

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
		console.log(' drive  driveTrack ', Session.get('driveTrack'));	
		var drive = Drives.find({driveTrackId: Session.get('driveTrack')._id }, {
			sort: {created: -1}, limit:5,
			transform: function(doc){	
				var time = doc.location.timestamp;
				time = moment(time).format("h:mm:ss");
				doc.time = time;
				console.log(' track drive 1 ', doc);
				if (!doc.location.coords.speed)
					doc.location.distance = 0;
				doc.location.distance = truncateDecimals(doc.location.distance, 2);
				doc.location.coords.speed = truncateDecimals(doc.location.coords.speed, 2);
				return doc;
			}
		});
//		driveTrack.driveTrackId = Session.get('driveTrack')._id;
		console.log(' drive ', drive);
		return drive;	
	},
	userDrives: function(){
		var userDrives = DriveTracks.find(
			{userId: Meteor.userId()},{
			sort: {created: -1}, limit:20,
			transform: function(doc){
				doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm");
				doc.duration = moment.duration(doc.timestampEnd - doc.timestamp).humanize();
				doc.dur_sec = doc.timestampEnd - doc.timestamp;
				if (doc.dur_sec > 60000)
					doc.show = true;
				return doc;
			}}
		);

		return userDrives;
	},
	driveTrack: function(){
		console.log('driveTrackId ', this._id);
		var driveTrack = DriveTracks.findOne({driveTrackId: this._id});
		return driveTrack;
	},
	
  distance: function(){
		var driveTrackId = this._id;
		var distance = 0;
		driveTrack = DriveTracks.findOne(driveTrackId);
		console.log(' driveTrack ', driveTrack);
		if (driveTrackId.distance) {
			return driveTrack.distance;
		}
		var driveTrackId = this._id;
		var cursor = Drives.find({driveTrackId: driveTrackId});
		console.log ('checking distance for 1 ', driveTrackId, cursor.location, cursor.fetch());
		cursor.forEach(function(item, index, array){
			var location = item.location;
			distance = distance + item.location.distance;
			distance = truncateDecimals(distance, 3);
			console.log ('checking distance 2 for each ', location, item.location.distance, distance);
		});
		DriveTracks.update(driveTrackId,{$set:{distance: distance}});
		distance = Math.round(distance / 1000 * 100)/100; // make it in km and round to 2 digs	
		return distance;
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
		var driveTrackId = DriveTracks.insert({userId: userId, timestamp: moment().valueOf(), created: new Date()});
		Session.set('driveTrackId', driveTrackId);
		console.log(' click startdriving driveTrack ', driveTrackId);
		Session.set('driving', true);
		Session.set('geoback', true );
		Session.set('interval', 1000000);
		PollingGeo();
//		PollingGeo();		
		return;
	},
	"click .stopdriving": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		if (Session.get('watchGPS')) {
			Meteor.clearInterval(Session.get('watchGPS'));
			Session.set('watchGPS', false);
		}
		var driveTrackId = Session.get('driveTrackId');
		var timestampEnd = moment().valueOf();
		var driveEnd = Drives.findOne({driveTrackId:driveTrackId},{sort: {timestamp: -1}});
		DriveTracks.update(driveTrackId,{$set:{timestampEnd: timestampEnd, driveEnd: driveEnd.location}});
		Session.set('driving', false);
		Session.set('driveTrackId', false);
		Session.set('geoback', false );
		PollingGeo();
		Session.set('interval', 1000000);
		Session.set('geoback', true);
		return;
	},
	'click .showMap': function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		//		var fitActivity = template.find('.fitActivity').id;
		var drvTrack = $(event.currentTarget).attr('id');
		console.log('click .showMap ',  drvTrack, $(event.currentTarget));
		Session.set('drvTrack', drvTrack);
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
		console.log(' drive  ', Session.get('drvTrack'));
		var drvTrack = Session.get('drvTrack');
		var track = Drives.find({driveTrackId:drvTrack},
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
		var drvTrack = Session.get('drvTrack');
		var track = FitnessTracks.findOne(drvTrack);
		console.log('drvTrack track ', track);
		return track;
	},
  driveMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('driveMap', function(map) {
        // Add a marker to the map once it's ready
				var track = Drives.find({driveTrackId:drvTrack},
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
			var drvTrack = Session.get('drvTrack');
			var trackStart = DriveTracks.findOne(drvTrack);			
			console.log('DriveTracks ',trackStart, drvTrack);
      // Map initialization options
      return {
        center: new google.maps.LatLng(trackStart.driveStart.coords.latitude, trackStart.driveStart.coords.longitude),
        zoom: 18
      };
    } else {
			console.log('GoogleMaps not yet loaded');
			GoogleMaps.load();
			if (GoogleMaps.loaded()) {
				console.log('GoogleMaps loaded');
			} else {
				console.log('GoogleMaps not yet loaded 2');	
			}
		}			
  }
});