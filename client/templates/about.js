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
		var user_email;
		var userId = Meteor.userId();
		var api_key;
		var create_profile;
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			var user_details = Meteor.user();
//			console.log('Meteor.user() ', Meteor.user());
		}
//		console.log('checking profile ', user_details);
/*     if (user_details.services.google !== undefined) {
        user_details.profile.profile_picture = user_details.services.google.picture;
    } */
//		console.log('checking profile ', user_details.profile);
		
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
		alert('coming soon');
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
		alert('coming soon');
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
		alert('coming soon');
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
	
	}
});

Template.userSettings.events({
	'click .removeauto': function (event, template) {
		var myId = $(event.currentTarget).attr("id");
		AutoPlaces.remove(myId);
	},
});

