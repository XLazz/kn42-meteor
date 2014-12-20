var userId = Meteor.userId(), limit = 20;
Meteor.subscribe('placesByGeo', userId, limit);
Meteor.subscribe('placesByUser', userId, limit);
Meteor.subscribe('TracksByUser', userId, limit);
fsqrHandle = Meteor.subscribe('CheckinsFsqr', userId, 100);
Tracker.autorun(function () {
    Meteor.subscribe('userData', userId);
		Meteor.subscribe("userinfo");
//    Meteor.subscribe("allUserData");
});
/* Template.registerHelper("Schemas", Schemas); */