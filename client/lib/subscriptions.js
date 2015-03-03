var userId = Meteor.userId(), limit = 100;
Meteor.subscribe('placesByGeo', userId, limit);
Meteor.subscribe('TracksByUser', userId, limit);
fsqrHandle = Meteor.subscribe('VenuesCheckins', userId, 100);
Tracker.autorun(function () {
    Meteor.subscribe('userData', userId);
		Meteor.subscribe("userinfo");
		Meteor.subscribe('news',userId);
		Meteor.subscribe('GeoLog',userId);
		
		Meteor.subscribe('autoPlacesByUser');
		Meteor.subscribe('TracksByUser');
		var subUserPlaces = Meteor.subscribe('UserPlaces', userId);
		Session.set('subUserPlaces', ! subUserPlaces.ready());
		var placesByUserHandle = Meteor.subscribe('placesByUser');
		Session.set('getPlacesNotReady', ! placesByUserHandle.ready());
		Meteor.subscribe('placesByGeo');
		
//		Meteor.subscribe('GooglePlaces');
		Meteor.subscribe('Places', userId);
		Meteor.subscribe('PlaceServices');
		Meteor.subscribe('AutoPlaces',userId);
		Meteor.subscribe('ClaimedPlaces',userId);
		Meteor.subscribe('Experiences',userId);
		Meteor.subscribe('MerchantsCache');
		
		Meteor.subscribe('VenuesCache',20);
		Meteor.subscribe('VenuesFsqr',userId);
		Meteor.subscribe('VenuesCheckins', userId);
		
		
		Meteor.subscribe('Contacts',userId);
		Meteor.subscribe('Drives', userId);
		Meteor.subscribe('DriveTracks', userId);
		Meteor.subscribe('Friends', userId);
		Meteor.subscribe('FitnessRoutes');
		Meteor.subscribe('FitnessActivities');
		Meteor.subscribe('FitnessTracks',userId);
		Meteor.subscribe('Tracks',userId);
		Meteor.subscribe('Contacts',userId);
		
//    Meteor.subscribe("allUserData");
});
/* Template.registerHelper("Schemas", Schemas); */