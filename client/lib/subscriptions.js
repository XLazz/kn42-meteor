var userId = Meteor.userId(), limit = 20;
Meteor.subscribe('placesByGeo', userId, limit);

Meteor.subscribe('TracksByUser', userId, limit);
fsqrHandle = Meteor.subscribe('CheckinsFsqr', userId, 100);
Tracker.autorun(function () {
    Meteor.subscribe('userData', userId);
		Meteor.subscribe("userinfo");
		var placesByUserHandle = Meteor.subscribe('placesByUser');
		Session.set('getPlacesNotReady', ! placesByUserHandle.ready());
		Meteor.subscribe('autoPlacesByUser');
		Meteor.subscribe('TracksByUser');
//    Meteor.subscribe("allUserData");
});
/* Template.registerHelper("Schemas", Schemas); */