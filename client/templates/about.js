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
	details: function(){
		var user_email;
		var userId = Meteor.userId();
		var api_key;
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			user_details = Meteor.user();
		}
		console.log('checking emails ', user_details);
    if (user_details.services.google !== undefined) {
        user_details.profile.profile_picture = user_details.services.google.picture;
    }
		console.log('checking emails ', user_details.profile);
		
		return user_details;
	},
});

Template.profileDetails.events({
	'click #connect': function (event, template) {
		if (Meteor.user()) {
				console.log('connecting with google');
				Meteor.connectWith("google");
		}		
	},
	'click #server': function (event, template) {
			Meteor.call('check_users', Meteor.userId());		
	},
});
