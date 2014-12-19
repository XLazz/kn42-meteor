var userId = Meteor.userId(), limit = 20;
Meteor.subscribe('placesByGeo', userId, limit);
Meteor.subscribe('placesByUser', userId, limit);
Meteor.subscribe('TracksByUser', userId, limit);
fsqrHandle = Meteor.subscribe('CheckinsFsqr', userId, 100);
/* Template.registerHelper("Schemas", Schemas); */