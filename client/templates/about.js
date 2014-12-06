Template.about.helpers({
	userId: function(){

		var userId = Meteor.userId();
		return userId;
	},
});

Template.profile.helpers({
	userId: function(){
		var userId = Meteor.userId();
		console.log ('profile helpers ', Meteor.userId(), Meteor.user()); 
		if (userId){

			return userId;
		} else {
			Overlay.show('loginoverlay');		
		}
	},
});

Template.profile.events({
	'click .logmein': function (event, template) {
		Overlay.show('loginoverlay');		
	},
});

Template.loginoverlay.helpers({
	userId: function(){
		var userId = Meteor.userId();
		if (userId){
			Overlay.hide();		
			return userId;
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
			if (user_details.profile !== undefined){
				create_profile = 1;
			} else {
				if (!Meteor.user().profile.firstName){
					create_profile = 1;
				}
			}
			if ((create_profile) && (user_details)) {
				console.log('user_details ', user_details);
				if (!user_details.emails) {
					Meteor.call('getKey', Meteor.userId(), function(err, results){
						user_details = Meteor.user();
					});
				} else {
					var user_email = user_details.emails[0].address;
					console.log('Meteor.user().profile ', user_email, user_details );
					var name = user_email.split('@')[0];
					Meteor.users.update({_id: userId},{$set:{'profile.firstName': name, 'profile.lastName': ' ', 'profile.picture': "img/app/robot.jpg"}});
				}
			}
				

/* 			if (!Meteor.user().profile) {
				Meteor.call('update_profile', Meteor.userId(), function(err,results){
					console.log('Meteor.call update_profile ', results);
				});			
			} else if (!Meteor.user().profile.firstName) {
				Meteor.call('update_profile', Meteor.userId(), function(err,results){
					console.log('Meteor.call update_profile ', results);
				});
			} */

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
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			return Meteor.user();
		}
	},
});

Template.profileDetails.events({
	'click #connect_google': function (event, template) {
		if (Meteor.user()) {
			console.log('connecting with google');
			Meteor.connectWith("google");
			Meteor.call('update_profile', Meteor.userId(), function(err,results){
				console.log('Meteor.call update_profile ', results);
//			console.log('Meteor.call update_profile ', results.google);
//			Meteor.users.upsert({_id: Meteor.userId()}, { $set: result });
				return results;
			});		
		}
	},
	'click #connect_fb': function (event, template) {
		alert('coming soon');
		return;
		if (Meteor.user()) {
				console.log('connecting with fb');
				Meteor.connectWith("facebook");
		}		
	},
	'click #connect_twtr': function (event, template) {
		alert('coming soon');
		return;
		if (Meteor.user()) {
				console.log('connecting with twtr');
				Meteor.connectWith("twitter");
		}		
	},
	'click #connect_fsqr': function (event, template) {
//		alert('coming soon');
		if (Meteor.user()) {
			console.log('connecting with fsqr');
			Meteor.connectWith("foursquare");
			Meteor.call('updateProfile', Meteor.userId);
		}		
	},
	'click #update_profile': function (event, template) {
		console.log('pic was clicked', Meteor.user());
		Meteor.call('showProfile', Meteor.userId(), function(err,results){
			console.log('Meteor.call update_profile ', err, results);
//			console.log('Meteor.call update_profile ', results.google);
//			Meteor.users.upsert({_id: Meteor.userId()}, { $set: result });
			return results;
		});
	},
});
