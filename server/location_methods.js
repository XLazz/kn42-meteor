Meteor.methods({

	getGLoc: function(userId, location, radius, initiator){
		var myError;
		// userlocation.coords.latitude
		if ((!userId) || (!location)){
			console.error('Called getGLoc, but ', userId, location, initiator);
			return;
		}
		if (!location.coords) {
			console.error('Called getGLoc, but location.coords ', location.coords, location, initiator);
			return;		
		}

		var coords = location.coords;

/* 		if (MerchantsCache.findOne({'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude}))
			return; */
		var response = GetGoogleLoc(userId, coords, radius);

		console.log('GetGoogleLoc called google ', userId, location.coords, response.results.length);
		if (!response) 
			return;
			
		if (!response.results)
			console.error('GetGoogleLoc empty call, increase radius?');
		
		for (var i = 0; i < response.results.length; i++) {		
//			console.log('inserting merchants 0 ', response.results[i].name);
			if (!MerchantsCache.findOne({place_id: response.results[i].place_id, 'coords.latitude': coords.latitude,  'coords.longitude': coords.longitude})) { 
				
				response.results[i].coords = coords;
				response.results[i].updated = new Date(),
//				response.results[i].geoId = userLocation.geoId;
				console.log('inserting merchants 1 ', response.results[i].name, response.results[i].name);
				MerchantsCache.upsert(
					{ 'place_id': response.results[i].place_id	},
					{	$set: response.results[i]	}
				);	
			}
		}
		return response;
	},
	
	getGPlace: function(place_id){
		var userId;
		if (!place_id)
			return;
		var myError;

		if (MerchantsCache.findOne({place_id: place_id}))
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
				place_id_addr: response.result.place_id,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
			}
		);			
		MerchantsCache.upsert(
			{ 'place_id': response.result.place_id	},
			{
				place_id: response.result.place_id,
				name: response.result.name,
				place_id_addr: response.result.place_id,
				geometry: response.result.geometry,
				icon: response.result.icon,
				scope: response.result.scope,
				types: response.result.types,
				vicinity: response.result.vicinity,
				formatted_address: response.result.formatted_address,
				formatted_phone_number: response.result.formatted_phone_number,
			}
		);
		return response;
	},
	
/* 	ifStatic: function(userId){
		if (!userId) {
			return;
		}
		return GetGoogleLoc(userId, userLocation, radius);
	}, */
});
