

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
		var driveTrack = Drives.find({driveTrackId: Session.get('driveTrack')._id }, {
			sort: {created: -1}, limit:5,
			transform: function(doc){	
				var time = doc.location.timestamp;
				time = moment(time).format("h:mm:ss");
				doc.time = time;
				console.log(' track drive 1 ', doc);
				doc.location.distance = truncateDecimals(doc.location.distance, 2);
				return doc;
			}
		});
//		driveTrack.driveTrackId = Session.get('driveTrack')._id;
		console.log(' track drive ', driveTrack);
		return driveTrack;	
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
		var sum = 0;
		var distance;
		var driveTrackId = this._id;
		var cursor = Drives.find({driveTrackId: driveTrackId});
		console.log ('checking distance for 1 ', driveTrackId, cursor.location, cursor.fetch());
		cursor.forEach(function(item, index, array){
			var location = item.location;
			sum = sum + item.location.distance;
			sum = truncateDecimals(sum, 3);
			console.log ('checking distance 2 for each ', location, item.location.distance, sum);
		});
		return sum;
	}
});

Template.driving.events({
	"click .startdriving": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var userId = Meteor.userId();
		DriveTracks.insert({userId: userId, timestamp: moment().valueOf(), created: new Date()});
		var driveTrack = DriveTracks.findOne({userId:Meteor.userId()},{sort: {timestamp: -1}});
		Session.set('driveTrack', driveTrack);
		console.log(' click startdriving driveTrack ', driveTrack);
		Session.set('driving', true);
		Session.set('geoback', true );
		Session.set('interval', 10000);
		PollingGeo();
//		PollingGeo();		
		return;
	},
	"click .stopdriving": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}

		var driveTrack = Session.get('driveTrack');
		var timestampEnd = moment().valueOf();
		var driveEnd = Drives.findOne({driveTrackId:driveTrack._id},{sort: {timestamp: -1}});
		DriveTracks.update(driveTrack._id,{$set:{timestampEnd: timestampEnd, driveEnd: driveEnd.location}});
		Session.set('driving', false);
		Session.set('driveTrack', false);
		Session.set('geoback', false );
		PollingGeo();
		Session.set('interval', 300000);
		Session.set('geoback', true);
		return;
	}
});

/* Template.autolog.rendered = function() {
//	Session.set('findfit', false);
  var $item = $(this.find('.findroute'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
} */