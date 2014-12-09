Meteor.startup(function () {
	Session.set('geoback', Meteor.user().profile.geoback );
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
});