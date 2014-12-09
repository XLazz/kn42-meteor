Template.friends_details.helpers({
	ifUser: function (){
		if (Meteor.userId()) {return 'true'};
	},
	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	},

});

Template.foursquare.helpers({
	friends: function(){
		var friends = {};
//		if (!Meteor.userId()) {return;};
//		if (!Session.get('changeplace')) {return};
//		var ready = Meteor.subscribe('Friends').ready();
		console.log('friendsFsqr local 1 ',  Meteor.userId(), Friends.find({userId: Meteor.userId()}).count(), Friends.find({userId: Meteor.userId()}).fetch()); 
		if (Friends.find({userId: Meteor.userId()}).count()) {

			friends = Friends.findOne({userId: Meteor.userId()});
			console.log('friendsFsqr local 2 ',  Meteor.user()._id, friends.foursquare);
			return friends.foursquare;
			//empty UserLocations, lets load from php
		}	
/* 		Meteor.call('friendsFsqr', Meteor.userId(), function(err, results) {
			console.log('Meteor.call friendsFsqr', results);
			return;
		}); */
	},
});

Template.friends_details.events({
	"click .updatefriends": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var userId = Meteor.userId();
		console.log('updatefriends events ');
		Meteor.call('showProfile', userId, function(err,results){
			console.log('Meteor.call update_profile ', err, results);
//			console.log('Meteor.call update_profile ', results.google);
//			Meteor.users.upsert({_id: userId}, { $set: result });
//			return results;
		});
		Meteor.call('friendsFsqr', userId, function(err, results) {
			console.log('Meteor.call friendsFsqr', results);
			myId = Friends.findOne({userId: userId}, {fields: {_id: 1}});
			console.log('myId', myId);
			if (myId) {
				Friends.upsert({_id: myId}, {userId: userId, 'foursquare': results });
			} else {
				Friends.insert({userId: userId, 'foursquare': results });
			}
			return results;
		});
		return friends;
	},

});