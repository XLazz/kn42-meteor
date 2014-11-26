Template.locations.helpers({
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
	showCreateDialog: function () {
		console.log('showCreateDialog kn42 helper ', this);
		return Session.get("showCreateDialog");
	},
	locationId: function(){
		return Session.get('locationId');
	},	
});


/* Template.kn42_locations.rendered = function(){

	var id = '#100';
	var el = $(this).find('#lat-100').value;
	console.log(' checking el in rendered ', el, ' for ', id);
}; */

/* (function( $ ){
   $.fn.jqueryFunc = function() {
      console.log('hello world');
      return this;
   }; 
})( jQuery ); */
/* Template.kn42_locations.events({  
  'click button.modal': function(event, template) {
    var name = template.$(event.target).data('modal-template');
    Session.set('activeModal', name);
  }
}); */

Template.kn42_locations.helpers({
	showCreateDialog: function () {
		console.log('showCreateDialog kn42 helper ', this);
		return Session.get("showCreateDialog");
	},
	locationId: function(){
		return Session.get('locationId');
	},
/* 	showPlace: function(){
		console.log('showPlace ',this);
		var id = Session.get('locationId');
//		id = '#lat-' + id;
		var el = $(this).find({'history_location_id': id}).value;
		console.log(' checking el in showPlace ', el, ' for ', id);
		if (el) {
			console.log(' checking el showPlace 2 ', el, ' for ', id);
			return 'yes';
		} else {
			console.log(' checking el showPlace 3 ', el, ' for ', id);
	//		return 'no';
	//		return 'yes';
			var dummy = '';
		}		
	}, */


});


Template.locations.events({
	"click .locations2": function (event, template) {
//		Modal.show('locationModal2');
		Session.set("showCreateDialog", true);
		console.log('locations events 2 ',Session.get("showCreateDialog"), this);
	},
	"click .reloadlocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('reloadlocations events ');
		Meteor.call('removeAllLocations', Meteor.userId());
		Meteor.call('getLocations', Meteor.userId(), 'list');
//		Meteor.call('getLocations','list',function(err,results));
	},
	"click .updatelocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('updatelocations events ');
		Meteor.call('getLocations', Meteor.userId(), 'list');
//		Meteor.call('getLocations','list',function(err,results));
	},
	"submit form": function (event, template) {
		// var inputValue = event.target.myInput.value;
		// var helperValue = this;
		// alert(inputValue, helperValue);
	}
});

Template.showlocations.helpers({
	userId: function(){
		return Meteor.userId();
	},
	locations: function(){
		var userLocations;
		console.log('locations ',this);
		if (!Meteor.userId()) {
			return;
		}
		if (UserLocations.find({userId: Meteor.userId()}).count() === 0 ){
			console.log('calling php server for json ', Session.get('userLocations'));
			Meteor.call('getLocations', Meteor.userId(), 'list', function(err,results){
				console.log('calling php server for json 2 ', results);
				userLocations = results;		
	//			Players.update(Session.get("userLocations"), {$inc: {score: 5}});
/* 				if (UserLocations.find().count() === 0) {
					Meteor.call('UpdateDB',Session.get('userLocations'),function(err,results){
						console.log('called UpdateDB');
					});
				} */
				return userLocations;
			});
		} else {
			console.log('calling mongo for json', Session.get('userLocations'));
//			console.log(' checking mongo UserLocations ', UserLocations.find({}, {sort: {started: -1}}));
			userLocations = UserLocations.find({userId: Meteor.userId()}, {sort: {started: -1}}).fetch();
			return userLocations;
		}
		
	},
	updated: function() {
//		Meteor.setInterval(Meteor.call('getLocations','list'), 1000000);	
	}
});

Template.showlocations.events({
	"click .locations": function (event, template) {
		console.log('locations events ',this);
		Session.set("showCreateDialog", true);
		
//		Modal.show('locationModal');
//		Modal.show('locationModal3');
		Session.set('radius', 50);
		var locationId = $(event.currentTarget).attr("id");
		var lat = template.find('#lat-' + locationId).value;
		var lng = template.find('#lng-' + locationId).value;
		Session.set('locationId', locationId);
		Session.set('lat', lat);
		Session.set('lng', lng);
		Session.set('getplaces', false);
//		Meteor.call('getLocations','list');
		console.log('locations events ', Session.get('locationId'), lat, lng);	
	},	

	"click .locations2": function (event, template) {
		Session.set("showCreateDialog", true);
		console.log('locations events 2 ',Session.get("showCreateDialog"), this);
	},
	
	'click .cancel': function(event, template) {
		console.log('click .cancel ',Session.get("showCreateDialog"), this);
		Session.set("showCreateDialog", false);
	}
});

Template.selectPlace.helpers({
	places: function(){
		console.log('places selectPlace ',Session.get('locationId'),this);
		
		if (Session.get('locationId')) {
			var locationId = Session.get('locationId');
			var gotPlaces = Places.find({locationId: locationId}).fetch();
			console.log(' got places already? 1 ', gotPlaces, Session.get('locationId'), Session.get('gotPlaces'), 'get places ', Session.get('getplaces'));
			if (Places.find({locationId: locationId}).count() === 0 ) {
				var myRadius = Session.get('radius');
				var getplaces = Session.get('getplaces');
				console.log(' running selectPlace.helper places location', Session.get('locationId'), Session.get('radius'), Session.get('lat'), Session.get('lng'), ' merchantes ',  Merchants.find({lat: Session.get('lat'), lng: Session.get('lng')}).fetch());
				if ((Merchants.find({lat: Session.get('lat'), lng: Session.get('lng')}).count() === 0) || (getplaces)) {
					console.log('calling php for places from client ', Session.get('lat'), Session.get('lng'), Session.get('radius'), Session.get('getplaces'));
					Meteor.call('getPlaces', Session.get('lat'), Session.get('lng'), Session.get('radius'), Session.get('getplaces'), function(err,results){
						gotPlaces = results;
						Session.set('gotPlaces', gotPlaces);
						Session.set('getplaces', '');
			//			Modal.show('locationModal');
						console.log('gotPlace from call ', gotPlaces);
						
						// _.each(
						// Places.insert(Places);
//						Session.set('radius', '');
					});
				} else {
					gotPlaces = Merchants.find({lat: Session.get('lat'), lng: Session.get('lng')}).fetch();
					Session.set('gotPlaces', gotPlaces);					
				}
				console.log(' call result  selectPlace.helper places location', gotPlaces);
				Session.set('oldlocation', locationId);
				Session.set('havePlaces', 1);
			} else  {
				var gotPlaces = Places.find({locationId: locationId}).fetch();
				Session.set('gotPlaces', gotPlaces);	
				console.log(' got places already 3 ', gotPlaces, Session.get('locationId'), Session.get('gotPlaces'));
			} 
			return Session.get('gotPlaces');
		}
	},
});

Template.locationModal.helpers({
	places: function(){
		console.log('locationModal.helpers set name ',this);
		if (Session.get('placeId'))  {
			var placeId = Session.get('placeId');
			var locationId = Session.get('locationId');
			var user_history_location_id = locationId;
			var myFetch = Places.find({locationId: locationId}).fetch();
			
			var myId = UserLocations.findOne({user_history_location_id: locationId});		
			UserLocations.update({_id: myId._id}, {$set: {name: Session.get('placeName')}});
			
			console.log(' placeId helper ', myId._id, locationId, placeId, myFetch, UserLocations.find({user_history_location_id: locationId}).fetch());
//			Session.set('lat', '');
			Session.set('locationId', '');
			Session.set('havePlace', 1);
			Session.set('havePlaces', 0);
			Session.set('placeId', '');
			Session.set('radius', 50);
			Session.set('getplaces', false);
			Session.set("showCreateDialog", false);
			return myFetch;
		}
	}
});

Template.locationModal.events({
	'click .cancel': function(event, template) {
		console.log('click .cancel ',Session.get("showCreateDialog"), this);
		Session.set("showCreateDialog", false);
		var radius = 50;
	},
	"click .setlocations": function (event, template) {
//		Session.set("showCreateDialog", true);
		console.log('locationModal events  ', Session.get("showCreateDialog"), $(event.currentTarget).attr("id"), this );
		
		var updated_loc = this;
		
//		Meteor.call('removeAllPlaces');

		var placeId = $(event.currentTarget).attr("id");
		if (placeId == '0') {
			placeId = '';
			Meteor.call('removeAllPlaces', Meteor.userId());
			var radius = Session.get('radius') + 200;
			Session.set('radius', radius);
			Session.set('getplaces', true);
			Meteor.call('getPlaces', Session.get('lat'), Session.get('lng'), Session.get('radius'), function(err,results){
				gotPlaces = results;
				Session.set('gotPlaces', gotPlaces);
			});
			return;
		}
		var placeName = template.find('#place-' + placeId).value

		var locationId = Session.get('locationId');
		var lat = Session.get('lat');
		var lng = Session.get('lng');
		Session.set('placeId', placeId);
		Session.set('placeName', placeName);
		console.log('set location', Session.get('locationId'), placeId, placeName);	
		var setPlace = ['yes'];
		console.log('setPlace ', setPlace);
		
		var dbPlacesCount = Places.find({locationId: locationId}).count();
		console.log('dbPlacesCount ', dbPlacesCount);
		if (dbPlacesCount === 0 ) {
			console.log('inserting Places ', dbPlacesCount);
			Meteor.call('UpdatePlaces', locationId, lat, lng, placeId, placeName, function(err,results){
			});
		} else {
			console.log('checking Places ', Places.find().fetch());		
			console.log('checking Places ', Places.find({locationId: locationId}).count(), Places.find().fetch());	
		}
		var myFetch = Places.find().fetch();
		var myId = UserLocations.findOne({user_history_location_id: locationId});		
		UserLocations.update({_id: myId._id}, {$set: {name: Session.get('placeName')}});		
		Session.set("showCreateDialog", false);
		console.log(' placeId event ', placeId, 'Places' , myFetch, 'UserLocations', UserLocations.find({user_history_location_id: locationId}).fetch());
		
	}
});

/* Template.locationModal.helpers({
	// places: function(){
		// var gotIt = Session.get("gotPlaces");
		// if (Session.get('location') == location){
			// console.log(' got places already ', Session.get('location'));
		// } else {
			// console.log(' running locationModal.helper places function ', Session.get('location'), Session.get('lat'), Session.get('lng'));
			// Meteor.call('getPlaces', Session.get('lat'), Session.get('lng'), function(err,results){
				// var gotPlaces = JSON.parse(results.content).google_places.results;
				// Session.set('gotPlaces', gotPlaces);
				// Modal.show('locationModal');
				// console.log('gotPlace', gotPlaces);
			// });
		// };
		// var location = Session.get('location');
		// return Session.get('gotPlaces');
	// }
}); */



