Template.claimPlace.helpers({
  sTypes: function () {
/*     return [
      {label: "2013", value: 2013},
      {label: "2014", value: 2014},
      {label: "2015", value: 2015}
    ]; */
    return PlaceServices.find({},{sort:{type:1}}).map(function (c) {
      return {label: c.type, value: c._id};
    });
  },
	coords: function () {
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
/* 		var result = GeoLog.findOne(userPlace.geoId);
		
		console.log('current userLocation ', userPlace.geoId, userPlace, result);
		if (result) {
		//Getting coords from Geolog
			var coords = result.location.coords;
		} else {
			var coords = userPlace.location.coords;
		} */
//		coords2 = results.location.coords.latitude + ',' + result.location.coords.longitude;
		var coords = userPlace.location.coords;
		console.log('current userPlace ', coords, userPlace);
		coords.latitude_harsh = parseFloat(coords.latitude).toFixed(4);
		coords.latitude = parseFloat(coords.latitude);
		coords.longitude_harsh = parseFloat(coords.longitude).toFixed(4);
		coords.longitude = parseFloat(coords.longitude);
		return coords;
	},
	place_id: function () {
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		var place_id = userPlace.place_id;
		return place_id;
	},
	userId: function(){
		return Meteor.userId();
	},
	created: function(){
		return new Date();
	},
});

/* Template.claimPlace.events({
	'submit form': function(event){
		onSuccess: function(operation, result, template) {
			Overlay.hide();
		}, 
		
//		event.preventDefault();
	},
}); */

AutoForm.addHooks("claimPlace", {
  onError: function () {
    console.log("onError hook called with arguments", arguments);
    console.log("onError hook context:", this);
  },
  onSuccess: function () {
    console.log("onSuccess hook called with arguments", arguments);
    console.log("onSuccess hook context:", this);
		Overlay.hide();
  },
});