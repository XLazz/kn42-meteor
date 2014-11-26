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
		var user_emails = Meteor.user().emails;
		user_email = Meteor.users.find({_id: userId}).fetch()[0].emails[0].address;
		console.log('checking emails ', user_emails, user_email);
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
		return user_email;
	},
});
