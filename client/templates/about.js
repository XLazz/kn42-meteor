Template.about.helpers({
	userId: function(){

		var userId = Meteor.userId();
		return userId;
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
			if (!user_details) {
				return;
			}
			if ((!user_details.profile.name) || (!user_details.profile.picture)){
					create_profile = 1;
					console.log('create_profile 1 ', Meteor.user());
			}
			if ((user_details.profile.foursquare) && (!user_details.profile.foursquareId)){
					create_profile = 1;
					console.log('create_profile foursquare ', Meteor.user());
			}
			if ((create_profile) && (user_details)) {
				console.log('user_details ', user_details);
			
				Meteor.call('updateProfile', Meteor.userId(), function(err, results){
					user_details = Meteor.user();
				});
			}
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

Template.profileDetails.events({
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
