Meteor.startup(function () {
	Session.set('geoback', 
		Meteor.user.findOne({fields: {'profile.geoback': 1, _id: 0}})
	);
	console.log(' setting initial sessiong geoback ', Meteor.user.findOne({fields: {'profile.geoback': 1, _id: 0}}));
});