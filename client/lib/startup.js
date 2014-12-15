Meteor.startup(function () {
	if (Meteor.isCordova) 
		screen.lockOrientation('portrait');
	Session.set('geoback', true );
	if (!Meteor.user())
		return;
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
/* 	if (!UserPlaces.findOne({userId:Meteor.user()}))
		Meteor.call('getLocations',Meteor.user(), 'list'); */
	// if (Meteor.isCordova) {

	//}
});