/* Meteor.publish('bookmarkCounts', function() {
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
}); */

// autopublish the user's bookmarks and admin status
Meteor.publish(null, function() {
/*   return Meteor.users.find(this.userId, {
    fields: {
      admin: 1,
			profile: 1,
      'services.twitter.profile_image_url_https': 1,
			'services.google.id': 1,
			'services.google.email': 1,
			'services.google.picture': 1,
			'services.google.locale': 1,
			'services.foursquare.id': 1,
			'services.foursquare.email': 1,
    }
  }); */
	return People.find();
	return Services.find();
	return Geolog.find({userId:this.userId},{limit:100});
	
	return Places.find({},{limit:100});
	return GooglePlaces.find({});
});

Meteor.publish('UserPlaces', function(userId) {
	return UserPlaces.find({userId:this.userId});
});
Meteor.publish('Places', function(userId) {
	return Places.find();
});
Meteor.publish('GooglePlaces', function(userId) {
	return GooglePlaces.find();
});
Meteor.publish('MerchantsCache', function(userId) {
	return MerchantsCache.find();
});
Meteor.publish('Drives', function(userId) {
	return Drives.find({userId:this.userId});
});
Meteor.publish('DriveTracks', function(userId) {
	return DriveTracks.find({userId:this.userId});
});
Meteor.publish('downloadPlaces', function(userId, limit) {
  var self = this;
	var api_key = GetApi(userId);
  try {
    var response = HTTP.get('http://kn42.xlazz.com/server/desktop.php', {
      params: {
        api_key: api_key,
				location: 'list',
      }
    });	
		
		var userLocations = JSON.parse(response.content).user_locations;
		console.log('called php server for json 3. num of els ', userLocations);
		userLocations.forEach(function (item, index, array) {
			if (!item) {
				console.log('got empty item on downloadPlaces ');
//				return;
			} else {
				console.log('inserting item for user 1 ', item.user_history_location_id, item.timestamp, item.timestampEnd, item.started, item.finished);
				if (!item.timestamp || item.timestamp == 0) 
					item.timestamp = moment(item.started).valueOf();
				if (!item.timestampEnd || item.timestampEnd == 0)
					if (item.finished)
						item.timestampEnd = moment(item.finished).valueOf();
				if (item.status == 'confirmed')
						item.confirmed = true;
				if (item.status == 'travel')
						item.travel = true;				
				if (item.status == 'fitness')
						item.fitness = true;		
				if (!item.userplaceId){
					var random = Random.id();
					_id = random;
					console.log('inserting item for user 2 ', userId, _id, item.userplaceId, random, Random.id());
				} else {
					_id = item.userplaceId;
					
				}
				var location = {coords: {latitude: item.latitude, longitude: item.longitude}};
				var doc = {
					_id: _id,
					userId: userId,
					user_history_location_id: item.user_history_location_id,
					location_id: item.location_id,
					location: location,
					place_id: item.place_id,
					started: item.started,
					finished: item.finished,
					timestamp: item.timestamp,
					timestampEnd: item.timestampEnd,
					confirmed: item.confirmed,
					travel: item.travel, 
					fitness: item.fitness,
				};
				console.log('inserting item for user ', userId, _id, item.user_history_location_id);
				UserPlaces.upsert(_id, doc);
				Meteor.call('getGPlace', item.place_id, function(err, results){
					console.log('getGPlace results.result.place_id.length ');
	/* 				if (results) { 
						console.log('getGPlace results.result.place_id.length ', results.result.place_id.length);
						if (results.result.place_id.length > 25) {
							var userLocation = {};
							userLocation.location = {};
							userLocation.location.coords = item;
							var radius = 30;
							Meteor.call('getGLoc', userId, userLocation, radius);
						}
					} */
					return;
				});				
			}
      
    });

    self.ready();

  } catch(error) {
    console.error(error);
  }
/////////////////////////////////////////////////////////////	
});

Meteor.publish("userinfo", function () {
	return Meteor.users.find({_id: this.userId}, {fields: {profile: 1, services: 1, admin: 1}});
});

Meteor.publish('CheckinsFsqr', function() {
  return CheckinsFsqr.find({}, {limit: 20});
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

Meteor.publishComposite('TracksByUser', function(userId, limit) {
	return {
		find: function() { return FitnessTracks.find({userId: userId}, {sort: {created: -1}, limit: limit}) },
		children: [
			{
				find: function(doc){return Tracks.find({fitnessTrackId: doc._id },{ limit: 1 })},
			},
			{
				find: function(doc){return FitnessActivities.find({_id: doc._activity },{ limit: 1 })},
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
					var radius_search = 0.001;
					var coords = geolog.location;
					if (coords) {
						var latup = parseFloat(coords.latitude) + radius_search;
						var latdown = parseFloat(coords.latitude) - radius_search;
						var lngup = parseFloat(coords.longitude) + radius_search;
						var lngdown = parseFloat(coords.longitude) - radius_search;					
						return ClaimedPlaces.find({'coords.latitude': { $gt: latdown, $lt: latup }, 'coords.longitude': { $gt: lngdown, $lt: lngup }});
					}
				}
			},{
				find: function(geolog){return checkinFsqr = CheckinsFsqr.find({userId:geolog.userId},{limit: 1})}
			}
/* 			CheckinsFsqr.find(
			{userId:userId},
			{
				sort: {createdAt: -1}, 
				limit: 20,
				transform: function(doc){
					doc.date =  moment.unix(doc.createdAt).format("MM/DD/YY hh:mm"); 
					// console.log('checkinsFsqr -1 ', doc.createdAt, doc.date, doc.id );
					return doc;
				}
			} */
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
			},{
				find: function(geolog){
					return checkinFsqr = CheckinsFsqr.find({userId:geolog.userId},{limit: 1})
				},
			}
		]
	}
});
