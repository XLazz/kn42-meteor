

Template.autolog.helpers({

	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	}
});

Template.autoroutes.helpers({
	ifDriving: function () {
		console.log(' driving ', Session.get('driving'));
		return Session.get('driving');
	},
	ifUser: function (){
		if (Meteor.userId()) {return 'true'};
	},
	
	drive: function(){
		console.log(' drive  driveTrack ', Session.get('driveTrack'));	
		var driveTrack = Drives.find({userId: Meteor.userId(), driveTrackId: Session.get('driveTrack')._id }, {
			sort: {timestamp: -1}, limit:5,
			transform: function(doc){	
				var time = doc.location.timestamp;
				time = moment(time).format("h:mm:ss");
				doc.time = time;
				return doc;
			}
		});
//		driveTrack.driveTrackId = Session.get('driveTrack')._id;
		console.log(' track drive ', driveTrack);
		return driveTrack;	
	},
	userDrives: function(){
		var userDrives = DriveTracks.find(
			{userId: Meteor.userId()},
			{transform: function(doc){
				doc.date = moment(doc.timestamp).format("MM/DD/YY HH:mm");
				doc.duration = moment.duration(doc.timestampEnd - doc.timestamp).humanize();
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
});

Template.autoroutes.events({
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
		UpdateGeo();
		PollingGeo();		
		return;
	},
	"click .stopdriving": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('interval', 300000);
		UpdateGeo();
		PollingGeo();
		var driveTrack = Session.get('driveTrack');
		var timestampEnd = moment().valueOf();
		DriveTracks.update(driveTrack._id,{$set:{timestampEnd: timestampEnd}});
/* 		var geolog = GeoLog.findOne({fitnessTrackId: fitnessTrack._id});
		GeoLog.update(geolog._id,{$set:{fitness: 'end'}}); */
		Session.set('driving', false);
		Session.set('driveTrack', false);
		return;
	}
});

Template.autolog.rendered = function() {
//	Session.set('findfit', false);
  var $item = $(this.find('.findroute'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
}