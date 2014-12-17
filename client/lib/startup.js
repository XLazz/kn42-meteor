Meteor.startup(function () {
	if (Meteor.isCordova) 
		screen.lockOrientation('portrait');
		
// initial start of geolog		
	Session.set('geoback', true );
	Session.set('interval', 300000);
	UpdateGeo();
	PollingGeo();
	
	if (!Meteor.user())
		return;
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
/* 	if (!UserPlaces.findOne({userId:Meteor.user()}))
		Meteor.call('getLocations',Meteor.user(), 'list'); */
	// if (Meteor.isCordova) {

	//}
});