

Template.fitness.helpers({
	ifUser: function (){
		userId = Meteor.userId();
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

		if (!Session.get('userLocation')) {
			place = UserPlaces.findOne({userId: userId},{sort: {timestamp: -1}});
			// if (place)
				// Session.set('userLocation', place);
		}
		if (Meteor.userId()) {return 'true'};
	},
	
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
	ifFindFit: function () {
		console.log(' findfit ', Session.get('findfit'));
		return Session.get('findfit');
	},
	ifFitness: function () {
		console.log(' findfit ', Session.get('findfit'));
		return Session.get('fitness');
	},
	activities: function(){
		return FitnessActivities.find();
	},
	geolog: function(){
		var geolog = GeoLog.find({userId: Meteor.userId()}, {
			sort: {timestamp: -1}, limit:5,
			transform: function(doc){	
				var time = doc.location.timestamp;
				time = moment(time).format("h:mm:ss");
				doc.time = time;
				return doc;
			}
		});
		console.log(' geolog fitness ', geolog);
		return geolog;
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
	"click .startfit": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('fitness', true);
		Session.set('findfit', false);
		Session.set('geoback', true );
		Session.set('interval', 30000);
		UpdateGeo();
		PollingGeo();
		return;
	},
	"click .stopfit": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		Session.set('fitness', false);
		Session.set('interval', 300000);
		UpdateGeo();
		PollingGeo();
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