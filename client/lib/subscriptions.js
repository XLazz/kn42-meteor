var userId = Meteor.userId(), limit = 20;
Meteor.subscribe('placesByGeo', userId, limit);
Meteor.subscribe('placesByUser', userId, limit);
Meteor.subscribe('TracksByUser', userId, limit);
/* Template.registerHelper("Schemas", Schemas); */