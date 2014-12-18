Meteor.startup(function () {
	if (Meteor.isCordova) 
		screen.lockOrientation('portrait');
		
// initial start of geolog		
	
	if (!Meteor.user())
		return;
	Session.set('geoback', true );
	Session.set('interval', 300000);
	UpdateGeo();
	PollingGeo();
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
/* 	if (!UserPlaces.findOne({userId:Meteor.user()}))
		Meteor.call('getLocations',Meteor.user(), 'list'); */
	// if (Meteor.isCordova) {

	//}
});