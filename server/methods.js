var ifUpdating;

Meteor.methods({

	updateProfile: function(userId){
		var user_details = Meteor.users.findOne(userId);
		console.log('updateProfile ', userId , user_details);
		if (!user_details) {
			return;
		}
		if (!user_details.emails) {
			console.log('no standard email, getting it from services for ', userId);
			var update = {};
			update.emails = [];
			update.emails[0] = {};
			update.emails[0].address = user_details.services.google.email;
			Meteor.users.upsert({_id:userId}, {$set: update});
			//		Meteor.users.upsert(userId, {$set: user_details});
		}		
		if ((!user_details.profile.picture) || (user_details.profile.picture == 'img/app/robot.jpg')) {
			console.log('no pic, getting it from services for ', userId);
			var picture;
			if (user_details.services.google.picture) {
				picture = user_details.services.google.picture;
			} else {
				if (user_details.profile.picture != 'img/app/robot.jpg')
				picture = 'img/app/robot.jpg';
			}
			if (picture)
				Meteor.users.update(userId, {$set: {'profile.picture': picture}});
		}
		return Meteor.users.findOne(userId);
	},
	
	updatePlace: function(userId, location, experience){
		// v008
		if ((!userId) || (!location))  {
			console.error('updatePlace and no location');
			return;
		}
		if ((!location.location_id) && (!location.userplaceId)){
			console.error('updatePlace and no location_id ', location);
			return;
		}		
		check(arguments, [Match.Any]);
		var place = UserPlaces.findOne(location.userplaceId);
		var api_key = GetApi(userId);
		//		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&had=' + had + '&stars=' + stars + '&comment=' + comment + '&location_id='+ location.location_id + '&google_place='+ place_id;
		if (place) {
			var url = 'http://kn42.xlazz.com/server/request.php?api_key=' +api_key +'&location=update&location_id='+ location.location_id + '&google_place=' +location.place_id + '&userplaceId=' + location.userplaceId + '&status=' +location.status +'&timestamp=' +place.timestamp+ '&timestampEnd=' +place.timestampEnd;
		} else {
			var url = 'http://kn42.xlazz.com/server/request.php?api_key=' +api_key +'&location=update&location_id='+ location.location_id + '&google_place=' +location.place_id + '&userplaceId=' + location.userplaceId + '&status=' +location.status ;
		}
		console.log('submitPlace  1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		console.log('submitPlace ', myJSON.content);
		var response = JSON.parse(myJSON.content);
		console.log('updatePlace answer 2 ', api_key, url, response );
		return response;
	},
	
	UserLocationsUpdate:function( userId, userPlaceId, place_id){
		var old_place = UserPlaces.findOne(userPlaceId, {fields: {place_id: 1, _id:0}});	
		var found = UserPlaces.find({userId: userId, place_id: old_place.place_id}).fetch();	
		UserPlaces.update({userId: userId, place_id: old_place.place_id}, {$set: {place_id: place_id}}, {multi:true});	

		console.log('updated UserLocations for all ', userId, ' old place ', old_place.place_id, ' new place ', place_id);
		return found;
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
		MerchantsCache.remove({});
		Places.remove({});	
		UserPlaces.remove({userId: userId});
/* 		VenuesFsqr.remove();
		VenuesCheckins.remove(); */
		return UserLocations.remove({userId: userId});
	},	
	
	'deleteGeoData': function(userId) {
		check(arguments, [Match.Any]);
		if (!userId) {
			return;
		}
		console.log('removing all geodata ');
		GeoLog.remove({userId:userId});
		GooglePlaces.remove({});
	},
	
	'showProfile': function(userId) {	
	// Checking if we have google user with the same email
//		var user = Meteor.users.findOne({_id: userId});
		var user = Meteor.users.find({}).fetch();
		var config = ServiceConfiguration.configurations.find().fetch();
		console.log(userId, user);
		return {user: user, config: config};
	},
	
	'uploadCoords': function(userId, api_key){
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

	'submitCoords': function(userId, geoId, location){
	// v008
		if (!userId) {
			return;
		}
		check(arguments, [Match.Any]);
		var got_location;
		var url;
		var api_key = GetApi(userId);
		console.log('submitCoords ', location);
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&location=list&lat=' + location.coords.latitude + '&long=' + location.coords.longitude + '&alt=' + location.coords.altitude + '&speed=' + location.coords.speed + '&accuracy=' + location.coords.accuracy + '&timestamp=' + location.timestamp + '&heading=' + location.coords.heading + '&locationId=' + geoId;
		console.log('submitCoords got_location 1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		got_location = JSON.parse(myJSON.content);
		console.log('submitCoords got_location 2 ', api_key, got_location.location_id, url);
		GeoLog.upsert(
			geoId,
			{$set: {location_id: got_location.location_id}}
		);
		Meteor.call('updatePlaces', userId);
		return got_location;
	},

	'submitPlace': function(userId, location, experience){
	// v008
		if ((!userId) || (!location))  {
			console.error('submitPlace and no location');
			return;
		}
		if ((!location.location_id) && (!location.userplaceId)) {
			console.error('submitPlace and no location_id ', location);
			return;
		}		
		var userplaceId = location.userplaceId;

		var place_id = location.place_id;
		check(arguments, [Match.Any]);
		var response;
		var url;
		var api_key = GetApi(userId);
//		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' + api_key + '&had=' + had + '&stars=' + stars + '&comment=' + comment + '&location_id='+ location.location_id + '&google_place='+ place_id;
		var url = 'http://kn42.xlazz.com/server/request.php?api_key=' +api_key +'&location=add&location_id='+ location.location_id + '&google_place=' +place_id + '&userplaceId=' + userplaceId;
		console.log('submitPlace  1 ', api_key, url);
		var myJSON = Meteor.http.call('GET',url);
		console.log('submitPlace ', myJSON.content);
		response = JSON.parse(myJSON.content);
		console.log('submitPlace answer 2 ', api_key, url, response );
		return response;
	},

	sendEmail: function(doc) {
		// Important server-side check for security and data integrity
		check(doc, Schemas.contact);
		
		// Build the e-mail text
		var text = "Name: " + doc.name + "\n\n"
		+ "Email: " + doc.email + "\n\n\n\n"
		+ doc.message;
		
		this.unblock();
		
		// Send the e-mail
		Email.send({
			to: "stanp@xlazz.com",
			from: doc.email,
			subject: "Website Contact Form - Message From " + doc.name,
			text: text
		});
	}	
});