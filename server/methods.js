Meteor.methods({

	'getLocations':function(userId, location){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		console.log('getLocations method for user ', userId);
		var last_loc;
		var api_key2 = Meteor.users.find({_id: userId}, {api_key:1, _id:0}).fetch();
		var api_key = api_key2[0].api_key;
		console.log('getLocations method for user ', userId, api_key2);
		var url = 'http://kn42.xlazz.com/server/desktop.php?api_key=' + api_key + '&location=' + location;
		var myJSON = Meteor.http.call('GET', url);
		console.log('calling php server for json 2 ', url, myJSON);
		var userLocations = JSON.parse(myJSON.content).user_locations;
		console.log('calling php server for json 3. First el ', userLocations[0]);
		var last_loc2 = UserLocations.find({userId: userId}, {sort: {user_history_location_id:	 -1}, limit: 1}).fetch()[0];
		if (last_loc2) {
			last_loc = parseInt(last_loc2.user_history_location_id);
		}
		userLocations.forEach(function (item, index, array) {
			console.log('inserting item for user ', userId, api_key, ' last_loc ', last_loc2, item);
			item['userId'] = userId;
			if ((parseInt(item.user_history_location_id) > last_loc) || (!last_loc)){
				UserLocations.insert(
					item
				);
			}
		});
/* 		UserLocations.insert(
			{
				locations: userLocations
			}
		); */
		UserLocations._ensureIndex( { user_history_location_id: 1 }, { unique: true, dropDups: true } );
		return userLocations;
	},
	
	'getPlaces': function(lat, lng, radius){
//		console.log('checking merchants for for lat and lng ', lat, lng, Merchants.find({lat: lat, lng: lng}).fetch()) ;
		check(lat, Match.Any);
		check(lng, Match.Any);
		check(radius, Match.Any);
		check(arguments, [Match.Any]);
		console.log('calling php on server for lat and lng radius', lat, lng, radius);
		var myJSON = Meteor.http.call('GET','http://kn42.xlazz.com/server/request.php?api_key=9WzPEI8HJJTA&location=places&lat=' + lat + '&long=' + lng + '&radius=' + radius);
			
		myMerchants = JSON.parse(myJSON.content);
//			console.log('got myMerchants for ', lat, lng, myMerchants);
		myMerchants = myMerchants.google_places.results;
//			console.log('got myMerchants 2 for ', lat, lng, myMerchants[0]);
		for (var i = 0; i < myMerchants.length; i++) {
			console.log('inserting merchants ', myMerchants[i].place_id);
			Merchants.upsert(
				{place_id: myMerchants[i].place_id},
				{
					place_id: myMerchants[i].place_id,
					name: myMerchants[i].name,
					vicinity: myMerchants[i].vicinity,
					lat: lat,
					lng: lng
				}
			);
		}
	},
	 
	'UpdateDB': function (userLocations) {
/* 		check(arguments, [Match.Any]);
		if (UserLocations.find().count() === 0) {
//			console.log("Importing locations.json to db userLocations ", userLocations);
//			var userLocations = JSON.parse(userLocations);
			userLocations.forEach(function (item, index, array) {
				console.log('inserting item ', item);
				UserLocations.insert(item);
			});
//			Players.update(Session.get("userLocations"), {$inc: {score: 5}});
		} */
	},
	
	'UpdatePlaces': function(locationId, lat, lng, place_id, name){
		check(arguments, [Match.Any]);
		if (place_id === 0){
			Places.remove(
				{locationId: locationId}
			);			
		} else {
			Places.upsert(
				{placeId: place_id},
				{$set: {
					locationId: locationId,
					lat: lat,
					lng: lng,					
					place_id: place_id,
					name: name
					}
				}
			);	
		}
	},
	
	'removeAllPlaces': function(userId) {
		if (!userId) {
			return;
		}
		return Places.remove({});	
	},
	'removeAllLocations': function(userId) {
		check(arguments, [Match.Any]);
		if (!userId) {
			return;
		}
		console.log('removing all locations ');
		Merchants.remove({});
		Places.remove({});	
		return UserLocations.remove({userId: userId});
	},	
	
	'deleteGeoData': function(userId) {
		check(arguments, [Match.Any]);
		if (!userId) {
			return;
		}
		console.log('removing all geodata ');
		GeoLog.remove({userId:userId});
	},

	getKey: function(email, userId){
		if (!userId) {
			return;
		}
		var sukey = '5oOaWrW41o6HJ0yZ';
		check(arguments, [Match.Any]);
		var url = 'http://kn42.xlazz.com/server/request.php?su_key=' + sukey + '&email=' + email;
		var myJSON = Meteor.http.call('GET', url);
		var user_details = JSON.parse(myJSON.content);
		console.log('got api_key ', user_details, url);
		if (user_details.api_key) {
			console.log('got api_key ', user_details.api_key );
//			Meteor.users.update({_id: userId}, {api_key: user_details.api_key});
			Meteor.users.update({_id: userId}, {$set: {api_key: user_details.api_key}});
		}
	},
	
	uploadCoords: function(userId, api_key){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var coords = GeoLog.find({userId: userId}, {sort: {created: -1}, limit: 10}).fetch();
//		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + lat + '&long=' + lng + '&alt=' + alt + '&speed=' + speed + '&timestamp=' + timestamp;
//		var myJSON = Meteor.http.call('GET',url);
//		got_location = JSON.parse(myJSON.content);
		console.log('uploadCoords got_location ', api_key, coords, got_location, url);
		return coords;
	},

	submitCoords: function(userId, timestamp, coords){
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var api_key2 = Meteor.users.find({_id: userId}, {api_key:1, _id:0}).fetch();
		console.log('submitCoords got_location ', api_key2); 
		if (!api_key2) {
			var user_email = Meteor.users.find({_id: userId}).emails[0].address;
			Meteor.call('getKey', user_email, Meteor.userId());
			var api_key2 = Meteor.users.find({_id: userId}, {api_key:1, _id:0}).fetch();
			console.log('submitCoords got_location ', api_key2, user_email, userId); 
		}
/* 		var api_key = api_key2[0].api_key;
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + coords.latitude + '&long=' + coords.longitude + '&alt=' + coords.altitude + '&speed=' + coords.speed + '&accuracy=' + coords.accuracy + '&timestamp=' + timestamp;
		var myJSON = Meteor.http.call('GET',url);
		got_location = JSON.parse(myJSON.content);
		console.log('submitCoords got_location ', api_key, coords, got_location, url); */
		return got_location;
	}
});