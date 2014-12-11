var userId = Meteor.userId(), limit = 20;
Meteor.subscribe('placesByGeo', userId, limit);
Meteor.subscribe('placesByUser', userId, limit);