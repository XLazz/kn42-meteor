Meteor.publish('bookmarkCounts', function() {
  return BookmarkCounts.find();
});

Meteor.publish('news', function() {
  return News.find({}, {sort: {date: -1}, limit: 1});
});

Meteor.publish('latestActivity', function () {
  return Activities.latest();
});

Meteor.publish('feed', function() {
  return Activities.find({}, {sort: {date: -1}, limit: 10});
});

Meteor.publish('recipe', function(name) {
  check(name, String);
  return [
    BookmarkCounts.find({recipeName: name}),
    Activities.find({recipeName: name})
  ];
});

// autopublish the user's bookmarks and admin status
Meteor.publish(null, function() {
  return Meteor.users.find(this.userId, {
    fields: {
      admin: 1,
      bookmarkedRecipeNames: 1,
			profile: 1,
      'services.twitter.profile_image_url_https': 1,
			'services.google.id': 1,
			'services.google.email': 1,
			'services.google.picture': 1,
			'services.google.locale': 1,
			'services.foursquare.id': 1,
			'services.foursquare.email': 1,
    }
  });
	return People.find();
	return Services.find();
});

People.allow({
  insert: function () {
    return true;
  },
  remove: function () {
    return true;
  }
});

/* Meteor.publish(null, function() {
	if (this.userId) {
		return Meteor.users.find({_id: this.userId}, {fields: {api_key: 1, profile: 1}});
	}
}); */

/* Meteor.publish('UserGeolog', function() {
	var lastGeoLogs = GeoLog.find(this.userId, {sort: {timestamp: -1}, limit: 40});
	var geoPlaces = lastGeoLogs.map(function(p) {return p.place_id});
  return [
		lastGeoLogs,
		Places.find({place_id: {$in: geoPlaces}})
	];
}); */

Meteor.publishComposite('autoPlacesByUser', function(userId, limit) {
	return {
		find: function() { return AutoPlaces.find({userId: userId}, {sort: {created: -1}, limit: limit}) },
		children: [
			{
				find: function(geolog){return Places.find({place_id: geolog.place_id },{ limit: 1 })}
			}	
		]
	}
});

Meteor.publishComposite('placesByUser', function(userId, limit) {
	return {
		find: function() { return UserPlaces.find({userId: userId}, {sort: {timestamp: -1}, limit: limit}) },
		children: [
			{
				find: function(geolog){return UserPlaces.find({place_id: geolog.place_id },{ sort: {timestamp: -1}, limit: 1 })}
			},{
				find: function(geolog){return Places.find({place_id: geolog.place_id },{ limit: 1 })}
			},{
				find: function(geolog){return MerchantsCache.find({place_id: geolog.place_id },{ limit: 1 })}
			},{
				find: function(geolog){return VenuesCache.find({place_id: geolog.place_id },{ limit: 1 })}
			},{
				find: function(geolog){return GeoLog.find({timestamp: geolog.timestamp },{ limit: 1 })}
			},{
				find: function(geolog){
					var coords = geolog.location;
					var radius_search = 0.001;
					var latup = parseFloat(coords.latitude) + radius_search;
					var latdown = parseFloat(coords.latitude) - radius_search;
					var lngup = parseFloat(coords.longitude) + radius_search;
					var lngdown = parseFloat(coords.longitude) - radius_search;					
					return ClaimedPlaces.find({'coords.latitude': { $gt: latdown, $lt: latup }, 'coords.longitude': { $gt: lngdown, $lt: lngup }});
				}
			}
		]
	}
});

Meteor.publishComposite('placesByGeo', function(userId, limit) {
	return {
		find: function() {
			// Find posts made by user. Note arguments for callback function
			// being used in query.
			return GeoLog.find({userId: userId}, {sort: {timestamp: -1}, limit: limit})
		},
		children: [
			{
				find: function(geolog) {
					// Find post author. Even though we only want to return
					// one record here, we use "find" instead of "findOne"
					// since this function should return a cursor.
					return Places.find(
						{ place_id: geolog.place_id },
						{ limit: 1 });
				}
			},
			{
				find: function(geolog) {
					// Find post author. Even though we only want to return
					// one record here, we use "find" instead of "findOne"
					// since this function should return a cursor.
					return MerchantsCache.find(
						{ place_id: geolog.place_id },
						{ limit: 1 });
				}
			}, {
				find: function(geolog) {
					// Find post author. Even though we only want to return
					// one record here, we use "find" instead of "findOne"
					// since this function should return a cursor.
					return ClaimedPlaces.find({}, { limit: 1 });
				}			
			
/* 			},{
				find: function(geolog){
					var coords = geolog.location;
					var radius_search = 0.001;
					var latup = parseFloat(coords.latitude) + radius_search;
					var latdown = parseFloat(coords.latitude) - radius_search;
					var lngup = parseFloat(coords.longitude) + radius_search;
					var lngdown = parseFloat(coords.longitude) - radius_search;					
					return ClaimedPlaces.find({'coords.latitude': { $gt: latdown, $lt: latup }, 'coords.longitude': { $gt: lngdown, $lt: lngup }});
				} */
			}
		]
	}
});
