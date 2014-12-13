Template.claimPlace.helpers({
  sTypes: function () {
/*     return [
      {label: "2013", value: 2013},
      {label: "2014", value: 2014},
      {label: "2015", value: 2015}
    ]; */
    return Services.find({},{sort:{type:1}}).map(function (c) {
      return {label: c.type, value: c._id};
    });
  },
	coords: function () {
		var userLocation = Session.get('userLocation');
		var result = GeoLog.findOne(userLocation.geoId);
		var coords = result.location.coords;
//		coords2 = results.location.coords.latitude + ',' + result.location.coords.longitude;
		console.log('current userLocation ', userLocation.geoId, result.location, coords);
		coords.latitude_harsh = coords.latitude.toFixed(4)-0;
		coords.longitude_harsh = coords.longitude.toFixed(4)-0;
		return coords;
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