Meteor.startup(function () {
	if (Meteor.isCordova) 
		screen.lockOrientation('portrait');
		
// initial start of geolog		
	
	if (!Meteor.user())
		return;
	startGeo();
	console.log(' setting initial sessiong geoback ', Meteor.user().profile.geoback);
	if (!UserPlaces.findOne({userId: Meteor.userId()})) {
		console.log('autostart getPlaces ', Session.get('getPlaces'), Session.get('getPlacesNotReady'));
  }
//	GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA'});
});