Meteor.startup(function () {
	if (Meteor.isCordova) 
		screen.lockOrientation('portrait');
		
// initial start of geolog		
	
	if (!Meteor.user())
		return;
/* 	Session.set('geoback', true );
	Session.set('interval', 300000); */
	UpdateGeo();
	PollingGeo();
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
	if (!UserPlaces.findOne({userId: Meteor.userId()})) {
		console.log('autostart getPlaces ', Session.get('getPlaces'), Session.get('getPlacesNotReady'));
		// if (Session.get('phpCall'))
			// return
/* 		var userId = Meteor.userId();
		var limit = 20;
    var searchHandle = Meteor.subscribe('downloadPlaces', userId, limit);
    Session.set('getPlacesNotReady', ! searchHandle.ready()); */
  }
});