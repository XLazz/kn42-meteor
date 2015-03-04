ifUpdating = 0;

Meteor.methods({

	getGLoc: function(userId, params, initiator){
		var myError;
		// userlocation.coords.latitude
		if ((!userId) || (!params.location) ){
			console.error('Called getGLoc, but ', userId, params.location, params.geoId, 'initiator:', initiator, params);
			return;
		}
		console.log('Called getGLoc 2 ', userId, 'userPlaceId ', params.userPlaceId, initiator);
		if (!params.location.coords) {
			console.error('Called getGLoc, but location.coords ', params.location.coords, params.location, initiator);
			return;		
		}

		var coords = params.location.coords;
		if (!params.name) 
			params.name = '';
		var response = GetGoogleLoc(userId, coords, params.radius, params.name);

//		console.log('getGLoc GetGoogleLoc called google ', userId, params.userPlaceId, coords, response.results.length);
			
		if ((!response) && (!response.results))
			console.error('GetGoogleLoc empty call, increase radius?');
		var ifAuto;
		var place_id;

		
		for (var i = 0; i < response.results.length; i++) {		
			console.log('inserting merchants 0 step ', i, ' response ', response.results[i].name);
			if (!MerchantsCache.findOne({place_id: response.results[i].place_id, 'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude})) { 			
				console.log('upserting merchants 1 ', response.results[i].place_id, response.results[i].name);
				MerchantsCache.upsert(
					{ 'place_id': response.results[i].place_id	},
					{	$set: 
						{
							coords: coords,
							place_id: response.results[i].place_id,
							icon: response.results[i].icon,
							name: response.results[i].name,
							vicinity: response.results[i].vicinity,
							types: response.results[i].types,
							updated: moment().valueOf()
						}
					}
				);	
			}
			if ((params.userPlaceId) && (!ifAuto)) {
				ifAuto = AutoPlaces.findOne({userId:userId, place_id:response.results[i].place_id});
				if (ifAuto) {
					place_id = response.results[i].place_id;
				} 
			}
		}
		if (response.results.length == 1) {
			place_id = response.results[0].place_id;
		} else {
			if (!ifAuto)
				place_id = response.results[1].place_id;
		}
		UserPlaces.update(params.userPlaceId, {$set: {place_id: place_id}});
//		ifStationary (userId, params.geoId);
		return response;
	},
	
	getGPlace: function(place_id){
		var userId;
		if (!place_id)
			return;
		var myError;

		if (MerchantsCache.findOne({place_id: place_id}))
			return;
		if (Places.findOne({place_id: place_id}))
			return;
		// Meteor._sleepForMs(200);
		// if (MerchantsCache.findOne({place_id: place_id}))
			// return;
		var response = GetGooglePlace(place_id);
		console.log('GetGooglePlace ', place_id, response.result.name);
		if (!response) {
			console.error('GetGooglePlace empty call');
			return;
		}			
		if (!response.result) {
			console.error('GetGooglePlace empty call');
			return;
		}		
//		console.log('GetGooglePlace call', response.result);
		Places.upsert(
			{ 'place_id': response.result.place_id	},
			{
				place_id: response.result.place_id,
				name: response.result.name,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
				updated: moment().valueOf(),
			}
		);			
		MerchantsCache.upsert(
			{ 'place_id': response.result.place_id	},
			{
				place_id: response.result.place_id,
				name: response.result.name,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
				updated: moment().valueOf(),
			}
		);
		return response;
	},
	
	updatePlaces: function(userId, ifDebug){		
		// 1st check with no place_id
		if (moment().valueOf() < ifUpdating + 60000) {
			console.log('ifUpdating in progress, exiting ', ifUpdating);
			return;
		}
		ifUpdating = moment().valueOf();
		console.log('empty places', UserPlaces.find({place_id: {$exists: false}}).count(), 'filled', UserPlaces.find({place_id: {$exists: true}}).count());
		
		var userPlaces = UserPlaces.find({userId: userId, place_id: {$exists: false}}, {limit: 50, sort:{timestamp: -1}	}	);
		if (!userPlaces.count()) {
			userPlaces = 'all filled up';
			ifUpdating = false;
			return userPlaces;
		}
		if (ifDebug)
		console.log('userPlaces with empty place_id. userId: ', userId, ' these many ',  userPlaces.count());
		userPlaces = userPlaces.fetch();
		var radius = 50;
		//		response = GetGoogleLoc(userId,  userPlaces.fetch()[0].location.coords, radius, name);
		//		console.log('userPlaces  ', response);
		var i = 0;
		var name = '';
		var place;
		if (!userPlaces) 
		return;
		userPlaces.forEach(function (item, index, array) {
			// console.log('');
			// if  (ifDebug)
			// console.log('updatePlaces calling GetGoogleLoc 1 item#', i++, userId, item.location.coords, radius, ifDebug);
			var response = GetGoogleLoc(userId, item.location.coords, radius, name, ifDebug);
			if  (ifDebug)
			console.log('updatePlaces calling GetGoogleLoc 2 item#', i,  'for item ', item._id, 'place_id', item.place_id, '# of google responses', response.results.length);
			if (response.results.length == 0)
			return;
			response.results.forEach(function (item, index, array) {
				var ifAuto = AutoPlaces.findOne({userId:userId, place_id:item.place_id});
				if (ifAuto) {
					if (ifDebug)
					console.log('userPlaces 0.5 ifAuto ', item.place_id, item.name);
					place = item;
					return place;
				}
			});
			if  (ifDebug)
			if (place)
			console.log('userPlaces 0.6 ', item._id, item.started, place.name, place.place_id);
			if (!place) {
				if ((response.results) && (item._id)) {
					if (response.results[1]) {
						place = response.results[1];
						if (ifDebug)
						console.log('userPlaces 1 ', item._id, item.started, place.name, place.place_id);
					} else {
						place = response.results[0];
						if (ifDebug)
						console.log('userPlaces 2 ', item._id, item.started, place.name, place.place_id);
					}
				}
			}
			place.updated = moment().valueOf();
			UserPlaces.update(item._id, {$set: {place_id: place.place_id}});
			if (!Places.findOne({place_id: place.place_id}))
			Places.insert(place);
			
		});
		ifUpdating = false;
	},	

	updatePlaceNames: function(userId, ifDebug){		
		return; //doesnt work yet
		// 1st check with no place_id
		if (ifUpdating)
		return;
		ifUpdating = true;
		console.log('empty places', UserPlaces.find({place_id: {$exists: false}}).count(), 'filled', UserPlaces.find({place_id: {$exists: true}}).count());
		
		var userPlaces = UserPlaces.find({userId: userId, place_id: {$exists: false}}, {limit: 50, sort:{timestamp: -1}	}	);
		if (!userPlaces) {
			userPlaces = 'all filled up';
			return userPlaces;
		}
		if (ifDebug)
		console.log('userPlaces with empty place_id. userId: ', userId, ' these many ',  userPlaces.count());
		userPlaces = userPlaces.fetch();
		var radius = 50;
		//		response = GetGoogleLoc(userId,  userPlaces.fetch()[0].location.coords, radius, name);
		//		console.log('userPlaces  ', response);
		var i = 0;
		var name = '';
		userPlaces.forEach(function (item, index, array) {
			console.log('');
			if  (ifDebug)
			console.log('updatePlaces calling GetGoogleLoc 1 item#', i++, userId, item.location.coords, radius, ifDebug);
			var response = GetGoogleLoc(userId, item.location.coords, radius, name, ifDebug);
			if  (ifDebug)
			console.log('updatePlaces calling GetGoogleLoc 2 item#', i,  'for item ', item._id, 'place_id', item.place_id, '# of google responses', response.results.length);
			if (response.results.length == 0)
			return;
			var place = response.results.forEach(function (item, index, array) {
				var ifAuto = AutoPlaces.findOne({userId:userId, place_id:item.place_id});
				if (ifAuto) {
					if (ifDebug)
					console.log('userPlaces 0.5 ifAuto ', item.place_id, item.name);
					return item;
				}
			});
			if  (ifDebug)
			if (place)
			console.log('userPlaces 0.6 ', item._id, item.started, place.name, place.place_id);
			if (!place) {
				if ((response.results) && (item._id)) {
					if (response.results[1]) {
						place = response.results[1];
						if (ifDebug)
						console.log('userPlaces 1 ', item._id, item.started, place.name, place.place_id);
					} else {
						place = response.results[0];
						if (ifDebug)
						console.log('userPlaces 2 ', item._id, item.started, place.name, place.place_id);
					}
				}
				place.updated = moment().valueOf();
				UserPlaces.update(item._id, {$set: {place_id: place.place_id}});
				if (!Places.findOne({place_id: place.place_id}))
				Places.insert(place);
			}
		});
		ifUpdating = false;
		//		Meteor.users.upsert(userId, {$set: user_details});
		
	},
});
