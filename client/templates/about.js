/* ifDebug = Sessions.get('ifDebug'); */

Template.about.helpers({
	userId: function(){

		var userId = Meteor.userId();
		return userId;
	},
	ifSettings: function(){
		return Session.get('showset');
	},
	ifAccounts: function(){
		return Session.get('showacc');
	},
	ifDebug: function(){
		return Session.get('debug');
	},
});

Template.about.events({
	'click #showset': function (event, template) {
		if (Session.get('showset')) {
			Session.set('showset', false);
		} else {
			Session.set('showset', true);
		}
		console.log('calling updateProfile ');
		Meteor.call('updateProfile', Meteor.userId());
	},
	'click #showacc': function (event, template) {
		if (Session.get('showacc')) {
			Session.set('showacc', false);
		} else {
			Session.set('showacc', true);
		}
	},
});

Template.profileDetails.helpers({
	user_details: function(){
		var userId = Meteor.userId();
//		var user_emails = Meteor.user().emails;
		if (!userId)
			return;
		var user_details = Meteor.user();
		if (!user_details)
			return;
		console.log(' pic ', user_details.profile.picture)
    if (!user_details.profile.picture) {
			console.log('call updateProfile ', userId, user_details.profile.picture)
			Meteor.call('updateProfile', userId, function(err,results){
				console.log('call updateProfile ', results);
			}); 
    }
		return user_details;
	},
	
});

Template.profilePic.helpers({
	user_details: function(){
		var user_email;
		var userId = Meteor.userId();
		var api_key;
		var create_profile;
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			var user_details = Meteor.user();
//			console.log('Meteor.user() ', Meteor.user());
			if (!user_details) {
				return;
			}
		}
		return user_details;
	},
	
});

Template.connectAccounts.helpers({
	ifDebug: function(){
		return Session.get('debug');
	},
	user_details: function(){
		var user_email;
		var userId = Meteor.userId();
		var api_key;
		var create_profile;
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			var user_details = Meteor.user();
//			console.log('Meteor.user() ', Meteor.user());
		}
		return user_details;
	},
	checkinsFsqr: function(){
		var userId = Meteor.userId();
		var checkinsFsqr = VenuesCheckins.find({userId:userId});
		if (checkinsFsqr && checkinsFsqr.count()){
			checkinsFsqr.count = checkinsFsqr.count();
		} else {
			console.log('checkinsFsqr 1 ', (moment().valueOf() - Session.get('FsqrCall')), checkinsFsqr.count() );
			if (!Session.get('FsqrCall'))
				Session.set('FsqrCall', 0);
			if (moment().valueOf() - Session.get('FsqrCall') > 3000) { 
				Session.set('FsqrCall', moment().valueOf());
				Meteor.call('checkinsFsqr', Meteor.userId(), function(err, results){
					var timestamp = moment().valueOf();
					Session.set('FsqrCall', timestamp);
					return;
				});
			}
		}
//		console.log('checkinsFsqr ', checkinsFsqr.fetch());
		return checkinsFsqr;
	},
	fsqrReady: function(){
		// the handle has a special "ready" method, which is a reactive
		// data source it indicates if the data provided by the publication 
		// has made its way to the client
		return fsqrHandle.ready();
	}
});

Template.connectAccounts.events({
	'click #connect_google': function (event, template) {
		if (Meteor.user()) {
			console.log('connecting with google');
			Meteor.connectWith("google");
				Meteor.call('updateProfile', Meteor.userId(), function(err, results){
					user_details = Meteor.user();
				});	
		}
	},
	'click #connect_fb': function (event, template) {
		alert('FB coming soon');
		return;
		if (Meteor.user()) {
				console.log('connecting with fb');
				Meteor.connectWith("facebook");
				Meteor.call('updateProfile', Meteor.userId(), function(err, results){
					user_details = Meteor.user();
				});
		}		
	},
	'click #connect_twtr': function (event, template) {
		alert('TWTR coming soon');
		return;
		if (Meteor.user()) {
				console.log('connecting with twtr');
				Meteor.connectWith("twitter");
				Meteor.call('updateProfile', Meteor.userId(), function(err, results){
					user_details = Meteor.user();
				});
		}		
	},
	'click #connect_fsqr': function (event, template) {
//		alert('coming soon');
		if (Meteor.user()) {
			console.log('connecting with fsqr');
			Meteor.connectWith("foursquare");
				Meteor.call('updateProfile', Meteor.userId(), function(err, results){
					user_details = Meteor.user();
				});
		}		
	},
	'click #connect_runk': function (event, template) {
		alert('Runkeeper coming soon');
		return;
		if (Meteor.user()) {
				console.log('connecting with runk');
				Meteor.connectWith("runkeeper");
				Meteor.call('updateProfile', Meteor.userId(), function(err, results){
					user_details = Meteor.user();
				});
		}		
	},
	'click #check_profile': function (event, template) {
//		Meteor.call('removevenuesFsqr');
		Meteor.call('showProfile', Meteor.userId(), function(err, results){
			console.log('showProfile ', results);
		});
		Meteor.call('updateProfile', Meteor.userId()) ;
		console.log(Meteor.status());	
	},
});

Template.profileDetails.events({

	'click #update_profile': function (event, template) {
		console.log('pic was clicked', Meteor.user());
		Meteor.call('updateProfile', Meteor.userId);
		Meteor.call('showProfile', Meteor.userId(), function(err,results){
			console.log('Meteor.call update_profile ', err, results);
//			console.log('Meteor.call update_profile ', results.google);
//			Meteor.users.upsert({_id: Meteor.userId()}, { $set: result });
			return results;
		});
	},
});

Template.userSettings.helpers({
	ifDebug: function () {
		return Session.get('debug');
	},
	autoplace: function(){
		var userId = Meteor.userId();
		var places = AutoPlaces.find({userId:userId});
		console.log('autoplaces ', places.count());
		return places;
	},
	place: function(){
		var place = Places.findOne({place_id:this.place_id});
		return place;
	},
	privacy: function(){
	
	},
	status: function(){
		var status = Meteor.status();
		console.log('meteor status ',  status);
		status.server = status.status;
		return status;
	}
});

Template.userSettings.events({
	'click .removeauto': function (event, template) {
		var myId = template.find('.removeauto');
		console.log('template.find ', myId.attr, myId.name, myId.id, myId );
		AutoPlaces.remove(myId.id);
	},
	'click .disconnect': function (event, template) {
		Meteor.disconnect();
		console.log('meteor status ',  Meteor.status());
	},
	'click .reconnect': function (event, template) {
		Meteor.reconnect();
		console.log('meteor status ',  Meteor.status());
	},
});

