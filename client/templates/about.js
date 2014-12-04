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
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			user_details = Meteor.user();
			console.log('Meteor.user().profile ', Meteor.user().profile);
			if (!Meteor.user().profile) {
				Meteor.call('update_profile', Meteor.userId(), function(err,results){
					console.log('Meteor.call update_profile ', results);
				});			
			}
/* 			if (!Meteor.user().profile.firstName) {
				Meteor.call('update_profile', Meteor.userId(), function(err,results){
					console.log('Meteor.call update_profile ', results);
				});
			} */
		}
		console.log('checking profile ', user_details);
/*     if (user_details.services.google !== undefined) {
        user_details.profile.profile_picture = user_details.services.google.picture;
    } */
		console.log('checking profile ', user_details.profile);
		
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
		}		
	},
	'click #connect_fb': function (event, template) {
		alert('coming soon');
		if (Meteor.user()) {
				console.log('connecting with fb');
				Meteor.connectWith("facebook");
		}		
	},
	'click #connect_twtr': function (event, template) {
		alert('coming soon');
		if (Meteor.user()) {
				console.log('connecting with twtr');
				Meteor.connectWith("twitter");
		}		
	},
	'click #server': function (event, template) {
			Meteor.call('check_users', Meteor.userId(), function(err,results){
			console.log('Meteor.call check_users ', results);
//			console.log('Meteor.call check_users ', results.google);
			Meteor.users.upsert({_id: Meteor.userId()}, { $set: result });
			return results;
		});
	},
});
