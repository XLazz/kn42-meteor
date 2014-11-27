Template.about.helpers({
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
});

Template.profileDetails.helpers({
	details: function(){
		var user_email;
		var userId = Meteor.userId();
		var api_key;
//		var user_emails = Meteor.user().emails;
		if (Meteor.userId()) {
			user_details = Meteor.users.find({_id: Meteor.userId()}).fetch()[0];
/* 			api_key = Meteor.users.find({_id: Meteor.userId()}, {api_key:1, _id:0}).fetch()[0].api_key;
			if (!api_key) {
				Meteor.call('getKey', user_details.emails[0].address, Meteor.userId(), function(err,results){
					gotKey = results;
					console.log('user details profileDetails ', api_key, gotKey, user_details, user_details.emails[0].address);
				});
			} */
		}
		console.log('checking emails ', user_details.emails[0].address, user_details);
		
/* 		user_emails.forEach(function (item, index, array) {
			console.log('checking emails ', item.address);
			user_email = item.address;
			console.log('checking emails ', user_email);
			var api_key = Meteor.user().api_key;
			if (!api_key) {
				Meteor.call('getKey', user_email, userId, function(err,results){
					gotKey = results;
					console.log('user details ', gotKey, user_email);
				});
			}
			console.log('user details ', api_key, user_email);
			return user_email;
		}); */
		return user_details;
	},
});
