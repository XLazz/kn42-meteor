

Template.test.helpers({
	ifUser: function (){
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
	checkinsFsqr: function(){
		var userId = Meteor.userId();
		var checkinsFsqr = CheckinsFsqr.find(
			{userId:userId},
			{
				sort: {createdAt: -1}, 
				limit: 20,
				transform: function(doc){
					doc.date =  moment.unix(doc.createdAt).format("MM/DD/YY"); 
					console.log('checkinsFsqr -1 ', doc.createdAt, doc.date, doc.id );
					return doc;
				}
			}
		);
		console.log('checkinsFsqr 0 ', checkinsFsqr.fetch() );
		if (checkinsFsqr && checkinsFsqr.count()){
			checkinsFsqr.count = checkinsFsqr.count();
		} 
	
		if (!Session.get('FsqrCall'))
			Session.set('FsqrCall', 0);
		if (moment().valueOf() - Session.get('FsqrCall') > 3000) { 
			console.log('checkinsFsqr 1 ', (moment().valueOf() - Session.get('FsqrCall')) );
			Session.set('FsqrCall', moment().valueOf());
			Meteor.call('checkinsFsqr', Meteor.userId(), function(err, results){
				var timestamp = moment().valueOf() + 5000;
				Session.set('FsqrCall', timestamp);
				return;
			});
		}
		console.log('checkinsFsqr ', checkinsFsqr.fetch());
		return checkinsFsqr;
	},
});

Template.test.events({
	"click .test": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var userId = Meteor.userId();
		console.log('test events ');
		cordova.call('getEmail', function (err, result) {
			console.log('getemail ',result);
			console.error('getemail ', err);
		}); 
			
		return friends;
	},

});

