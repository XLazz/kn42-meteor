Meteor.startup(function () {
	screen.lockOrientation('portrait');
	if (!Meteor.user())
		return;
	Session.set('geoback', Meteor.user().profile.geoback );
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
/* 	if (!UserPlaces.findOne({userId:Meteor.user()}))
		Meteor.call('getLocations',Meteor.user(), 'list'); */
	// if (Meteor.isCordova) {

	//}
});