var FEATURED_COUNT = 4;
var i = 0;

findExperiences = function(){
	var services = Services.findOne({
		place_id: Session.get('currentPlace')
	});
	if (services) {
		console.log('experiences ', services);
		return services.experiences;
	}
	var currentPlace = Places.findOne({place_id: Session.get('currentPlace')});
	if (currentPlace){
		console.log('experiences ', currentPlace.types);
		return currentPlace.types;
	}
}

Template.home.helpers({	
  // selects FEATURED_COUNT number of recipes at random
/*   featuredRecipes: function() {
    var recipes = _.values(RecipesData);
    var selection = [];
    
    for (var i = 0;i < FEATURED_COUNT;i++)
      selection.push(recipes.splice(_.random(recipes.length - 1), 1)[0]);
    return selection;
  }, */
  
/*   activities: function() {
    return Activities.latest();
  }, */
  
  latestNews: function() {
    return News.latest();
  },
});

Template.home.events({

});

Template.homeinside.helpers({
	ifUser: function (){
		if (Meteor.userId()) {return 'true'};
	},
	
	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	},
	
	currentlocation: function(){
		if (!Meteor.userId()) {return;};
		userId = Meteor.userId();
		var currentPlace = GeoLog.findOne({userId: userId}, {sort: {created: -1}});
//		console.log('currentlocation ', this, this.place_id);
		
		return currentPlace;
	},

	userPlace: function() {
//		console.log('userPlace 0 ', this, this.status);
		if (!this.status) {
//			console.log('userPlace 0.5 ', this, this.status);
			return;
		}
		if (this.status !== 'stationary') {
//			console.log('userPlace 1 ', this, this.status);
			return;
		}
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = UserPlaces.findOne({place_id: this.place_id});
//		console.log('userPlace 2 ', this, this.place_id, place);
		Session.set('userLocation', place);
		return place;
	},
	
	geoPlace: function() {
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = Places.findOne({place_id: this.place_id});
		console.log('geoPlace ', this.place_id, place);
		return place;
	},

	geoMerchant: function() {
		var userId = Meteor.userId();
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'googlePlace.place_id': this.place_id});
		if (!place) {
			var radius = 50;
			Meteor.call('getGLoc', userId, this.place, radius, function(err, results) {
				console.log('getGLoc call ', this.place_id, results);
				return results;
			});
		} else {
			if (!Session.get('userLocation')) {
				Session.set('userLocation', place);
			}
		}
		console.log('geoMerchant ', this, this.place_id, place);
		return place;
	},	
		
/* 	currentPlace: function(){	
//		if (!Session.get('changeplace')) {return};
//		var ready = Meteor.subscribe('UserLocations').ready();
	
		if (!UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}})) {
			//empty UserLocations, lets load from php
			Meteor.call('getLocations', Meteor.userId(), 'list', function(err, results) {
				console.log('Meteor.call getLocations', results);
				return;
			});
		}
//		console.log('currentplaces before findOne ', i++, UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}) );
//		var userLocation = UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}});
//		if (!userLocation) {return;}
		
//		ready = places.ready();
		
//		lastPlaces.started = UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}).started;
//		console.log('home currentplaces lastPlaces 2 ', ready, places);
		Session.set('userLocation', currentPlace);
		return currentPlace;
		
	}, */
	
	currentplace: function(){
		userLocation = Session.get('userLocation');
		if (!userLocation)
			return;
		if (!userLocation.user_history_location_id)
			return;
		var place = Places.findOne({place_id: userLocation.place_id});
		
		if (!place) {
			place = MerchantsCache.findOne({place_id: userLocation.place_id});
		}
		if (!place) {
			console.log('no content, going for call to getPlaces');
			Meteor.call( 'getPlaces', Meteor.userId(), userLocation, 50, function(err, results){
				console.log('Meteor.call getPlaces', results);
				return {'currentplace': results};
			});
			return place;
		}
		
		if (!userLocation.name) {
			UserLocations.update({_id: userLocation._id}, {$set:{name: place.name}});
		}
			
		place.timespent = moment(userLocation.started).fromNow();
		console.log('currentplace started ', userLocation.started );
		return place;
	},
	
	placeconfirmed: function(){
		currentPlace = UserLocations.findOne({user_history_location_id: Session.get('userLocation').user_history_location_id, confirmed: 1});
		if (currentPlace) {
			console.log('experiences placeconfirmed ', currentPlace.place_id);
			return currentPlace;
		}
	},
	
	status: function(){
		if (!Meteor.userId()) {return;};
		var lastGeoLog = GeoLog.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {timestamp: -1}});
		if (!lastGeoLog) {return};
		if (!lastGeoLog.status) {
			if (!Session.get('geoback')) {
				return 'service is not running';
			} else {
				return 'location can not be updated';
			}
		}
		return lastGeoLog.status;	
	},	

	changeplace: function(){
		return Session.get('changeplace');
	},
	
	showexpselect: function(){
		return Session.get('showexp');
	},
	
	exp1: function(){
		$('#input-tags').selectize({
				delimiter: ',',
				persist: false,
				create: function(input) {
						return {
								value: input,
								text: input
						}
				}
		});	
	}
});

Template.homeinside.events({
	'click .goprofile': function(event, template) {
		Router.go('about');
	},
	'click .change': function (event, template) {
		var place_id = $(event.currentTarget).attr("id");
		Session.set('radius', 50);
		console.log('changing place ', place_id);
		return Session.set('changeplace', true);
	},
	
/* 	'click .confirm': function (event, template) {

//		Meteor.call('getLocations','list');
		var user_history_location_id = $(event.currentTarget).attr("id");
		
		var userLocation = UserLocations.findOne({user_history_location_id: user_history_location_id}, {fields: {_id: 1, place_id: 1, name: 1}});		
		console.log('userLocation ', user_history_location_id, userLocation);
		var myPlace = MerchantsCache.findOne({place_id: userLocation.place_id}, {fields: {_id: 0}});		
		if (!userLocation.name) {
			console.log('click .confirm Call for MerchantsCache ');
		}
		var myId = Places.findOne({place_id: userLocation.place_id}, {fields: {_id: 1}});		
		console.log('confirming place_id ', userLocation.place_id, myPlace, myId );
		myPlace.confirmed = 1;
		myPlace.updated = new Date();
		if (myId) {
			UserLocations.upsert(
				{_id: userLocation._id}, 
				{ $set: 
					{confirmed: 1}
				}
			);		
			Places.upsert(
				{_id: myId._id}, 
				{
					$set: myPlace
				}
			);		
		} else {
			Places.insert(
				{
					$set: myPlace
				}
			);					
		}
			
		return Session.set('changeplace', false);
	}, */

	"click .expselect": function (event, template) {
		Session.set('showexp', true);
	},	
});

Template.selectExperience.helpers({
	experiences: function(){
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var services = Experiences.find({ place_id: userLocation.place_id, userId: userId });
		console.log('experiences Experiences ', Session.get('userLocation'), userLocation.place_id, services.fetch());
		if (services.count()) {
			console.log('experiences return ', services.fetch());
			return services.fetch();
		}
		var services = Services.find({place_id: userLocation.place_id});
		console.log('experiences Services ',userLocation.place_id, services.fetch());
		if (services.count()) {
			return services.fetch();
		}
	},
	types: function(){
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var currentPlace = Places.findOne({place_id: userLocation.place_id});
		console.log('experiences Places ', userLocation.place_id, currentPlace);
		if (currentPlace){		
			return currentPlace.types;
		}
		currentPlace = MerchantsCache.findOne({place_id: userLocation.place_id});
		console.log('experiences MerchantsCache ', userLocation.place_id, currentPlace);		
		return currentPlace.types;
	},
	
	currentPlace: function() {
		return Session.get('userLocation').user_history_location_id;
	},
});

Template.selectExperience.events({
	'submit form': function(event){
    event.preventDefault();
		console.log(event.target.selected);
		var experience = $( "#select-" + Session.get('userLocation').user_history_location_id +"-empty").val();
//		var experiences = $.csv.toArray(experiences);
		console.log('experiences selectExperience.events ', experience);
		Experiences.insert({
			userId: Meteor.userId(),
			experience: experience,
			place_id: Session.get('userLocation').place_id,
			created: new Date(),
		});		
		/* experiences.forEach(function (item, index, array){
			if (item){
				item = item.replace(/\s+/g, '');
				if	((!Experiences.findOne({place_id: Session.get('currentPlace'), experience: item, userId: Meteor.userId()})) && (item)) {		
					console.log('experiences inserting item ', Session.get('currentPlace'), item, Meteor.userId(), Experiences.findOne({place_id: Session.get('currentPlace'), experience: item, userId: Meteor.userId()}));
					Experiences.insert({
						userId: Meteor.userId(),
						experience: item,
						place_id: Session.get('currentPlace'),
						created: new Date(),
					});
				}
			}
		}); */
		return experience;
	},

});

Template.buttons.helpers({
	buttons: function(){
		if (Session.get('userLocation')) {
			place = UserPlaces.findOne({place_id: Session.get('userLocation').place_id});
			console.log('buttons location ', Session.get('userLocation'), place);
			return Session.get('userLocation');
		}
	},
	session: function(){
		return Session.get('userLocation');
	},
});


Template.buttons.events({
	"click .confirm": function (event, template) {
		var curr_event = template.find('input').value.replace(/\s+/g, '');
		console.log('buttons click .confirm curr event ', curr_event, $(event.currentTarget) );
		console.log('click .confirm buttons confirming userLocation ');
		var userLocation = Session.get('userLocation');
		console.log('click .confirm buttons confirming userLocation ', userLocation );
		if (!userLocation.name) {
			alert('Cant confirm Unknown. Please click on Change button first');
			return;
		}
		UserLocations.upsert({_id: userLocation._id}, {$set: {confirmed: 1, travel: ''}});		
	},	 
	"click .undo": function (event, template) {
		var userLocation = Session.get('userLocation');
		console.log('click .confirm buttons confirming userLocation ', userLocation._id );
		UserLocations.upsert({_id: userLocation._id}, {$set: {confirmed: '', travel: ''}});		
	},	
	"click .locations": function (event, template) {
		var radius = 50;
		var timestamp;
		var userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		console.log('locations events 1 ',this.place_id, userLocation);
//		Meteor.call('getLocations','list');
/* 		Meteor.call('getGLoc', userId, userLocation.location, radius, function(err, results){
			console.log('locations events getGLoc results ', results.results);	
		}); */
		console.log('locations events ', Session.get('userLocation'));	
		Session.set('searching', false);
		Session.set('radius', radius);
		Overlay.show('selectPlace');	
	},
	"click .travel": function (event, template) {
//		alert('coming soon');
		var userLocation = Session.get('userLocation');
		console.log('click .travel buttons confirming userLocation ', userLocation.user_history_location_id );
		UserLocations.upsert({_id: userLocation._id}, {$set: {travel: 1, icon2: 'img/app/car.png'}});	
	},		
});

UI.registerHelper('ifConfirmed2', function () {
  // extract boolean value from data context. the data context is
  // always an object -- in this case it's a wrapped boolean object.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
  var isBlock = this.valueOf();
//	isBlock = Number.isInteger(isBlock);
	if (!Session.get('userLocation'))
		return Template._no_exp2;
	
//	console.log('isBlock ifConfirmed2 ', isBlock, Session.get('userLocationId'), this.valueOf(), this);

  if (isBlock == Session.get('userLocation').user_history_location_id) {
		console.log('isBlock check ', isBlock);
    return Template._show_exp2;
  } else {
//		console.log('isBlock check 2 ', isBlock);
    return Template._no_exp2;
	}
});

Template.common_kn.helpers({
	status: function() {
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
	ifService: function() {
		return Session.get('geoback')
	},
});

Template.venues.helpers({
	venuesNearby: function(){
		var userId = Meteor.userId();
		var callFsqr;
		var query = {}
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		var userLocation = Session.get('userLocation');
		console.log('venuesNearby 1 ', userLocation);
		if (userLocation.name) {
			var name = userLocation.name;
			name = name.split(" ");
			query.what = name[0];
			query.radius = 50;
			console.log('venuesNearby 1.2 looking for ', name, query);
		}
		if (!userId) {return} ;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

		var venues = VenuesCache.findOne(
		{
			latitude: userLocation.latitude,
			longitude: userLocation.longitude,
		});
		console.log('venuesNearby 1.3 found venues in VenuesCache ', venues);
/* 		if (venues) {
			console.log('venuesNearby ', venues.foursquare);
			return venues.foursquare;
		} */
		if (!userLocation)  {return} ;
		if (!venues) {
			console.log('venuesNearby 2 ', venues);
			callFsqr = true;
		} else {
			if (!venues.foursquare) {
				console.log('venuesNearby 3 ', venues);
				callFsqr = true;
			} else {
				console.log('venuesNearby 3.5 ', venues.foursquare);
				if (!venues.foursquare.length) {
					console.log('venuesNearby 3.6 ', venues.foursquare);
					callFsqr = true;
				} else {
//					console.log('venuesNearby 3.7 ', venues.foursquare);
					var name = venues.foursquare[0].name;
					name = name.substr(0,name.indexOf(' '));		
					if (query.what !== name) {				
						console.log('venuesNearby 3.8 ', query.what, venues.foursquare[0]);
						callFsqr = true;
					} else {
						console.log('venuesNearby 3.9 names are same. skipping call ', query.what, venues.foursquare[0].name);
					}
				}
			}
		}
		var timediff = moment().valueOf() - Session.get('fsqrStamp');
		console.log('venuesNearby 5 ', userLocation.user_history_location_id, query.what, callFsqr, timediff, venues);	
//		if ((!venues) && ((Session.get('fsqrStamp') < moment().valueOf() - 10) || (!Session.get('fsqrStamp'))) ) {	
		if ((callFsqr) && ((moment().valueOf() - Session.get('fsqrStamp') > 1000) || (!Session.get('fsqrStamp'))) ) {
			Session.set('fsqrStamp', moment().valueOf());
			Meteor.call('venuesFsqr', userId, userLocation, query, function(err, results) {
				console.log('Meteor.call venuesFsqr', results);
				return results;
			});
		}
		if (venues) {
			return venues.foursquare;
		}
	},
});

Template.venuesSelected.helpers({	
	venuesSelected: function(){
		var userId = Meteor.userId();
		var callFsqr;
		var query = {}
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		var userLocation = Session.get('userLocation');
		console.log('venuesSelected 1 ', userLocation);
		if (userLocation.name) {
			var name = userLocation.name;
			name = name.split(" ");
			query.what = name[0];
			query.radius = 50;
			console.log('venuesSelected 1.2 looking for ', name, query);
		}
		if (!userId) {return} ;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

		var venues = VenuesCache.findOne(
		{
			latitude: userLocation.latitude,
			longitude: userLocation.longitude,
		});
		console.log('venuesSelected 1.3 found venues in VenuesCache ', venues);
/* 		if (venues) {
			console.log('venuesNearby ', venues.foursquare);
			return venues.foursquare;
		} */
		if (!userLocation)  {return} ;
		if (!venues) {
			console.log('venuesSelected 2 ', venues);
			callFsqr = true;
		} else {
			if (!venues.foursquare) {
				console.log('venuesSelected 3 ', venues);
				callFsqr = true;
			} else {
				console.log('venuesSelected 3.5 ', venues.foursquare);
				if (!venues.foursquare.length) {
					console.log('venuesSelected 3.6 ', venues.foursquare);
					callFsqr = true;
				} else {
//					console.log('venuesSelected 3.7 ', venues.foursquare);
					var name = venues.foursquare[0].name;
					name = name.split(" ");
					name = name[0];
					if (query.what !== name) {				
						console.log('venuesSelected 3.8 ', query.what, name, venues.foursquare[0].name);
						callFsqr = true;
					} else {
						console.log('venuesSelected 3.9 names are same. skipping call ', query.what, venues.foursquare[0].name);
					}
				}
			}
		}
		var timediff = moment().valueOf() - Session.get('fsqrStamp');
		console.log('venuesSelected 5 ', userLocation.user_history_location_id, query.what, callFsqr, timediff, venues);	
//		if ((!venues) && ((Session.get('fsqrStamp') < moment().valueOf() - 10) || (!Session.get('fsqrStamp'))) ) {	
		if ((callFsqr) && ((moment().valueOf() - Session.get('fsqrStamp') > 1000) || (!Session.get('fsqrStamp'))) ) {
			Session.set('fsqrStamp', moment().valueOf());
			Meteor.call('venuesFsqr', userId, userLocation, query, function(err, results) {
				console.log('Meteor.call venuesSelected venuesFsqr', results);
				return results;
			});
		}
		if (venues) {
			return venues.foursquare;
		}
	},
});


Template.venues.events({
	"click .updatevenues": function (event, template) {
		var userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var query = {};
		
		var venues;
		
		if (!Meteor.userId()) {
			return;
		}
		if (!userLocation) {
			var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;
		} else {
			var name = userLocation.name;
			query.what = name.substr(0,name.indexOf(' '));
			query.radius = 200;
		}
		console.log('updatevenues events ', query.what, userLocation );
		Meteor.call('removevenuesFsqr', userId, userLocation, query, function(err, results) {
			console.log('Meteor.call event removevenuesFsqr', userLocation.name, results);
			return results;
		});
/* 		Meteor.call('venuesFsqr', userId, userLocation, query, function(err, results) {
			console.log('Meteor.call event venuesFsqr', userLocation.name, results);
			return results;
		}); */
		return venues;
	},
	


});