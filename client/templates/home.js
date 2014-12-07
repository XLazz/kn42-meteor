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
	
	currentlocation: function(){
		if (!Meteor.userId()) {return;};
//		if (!Session.get('changeplace')) {return};
		var ready = Meteor.subscribe('UserLocations').ready();
		if (!UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}})) {
			//empty UserLocations, lets load from php
			Meteor.call('getLocations', Meteor.userId(), 'list', function(err, results) {
				console.log('Meteor.call getLocations', results);
				return;
			});
		}
//		console.log('currentplaces before findOne ', i++, UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}) );
		var userLocation = UserLocations.findOne({
			userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}});
		if (!userLocation) {return;}
		
//		ready = places.ready();
		
//		lastPlaces.started = UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}).started;
//		console.log('home currentplaces lastPlaces 2 ', ready, places);
		Session.set('userLocation', userLocation);
		return userLocation._id;
		
	},
	
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
	userLocation: function(){
		userLocation = UserLocations.findOne({user_history_location_id: Session.get('userLocation').user_history_location_id});
//		console.log('buttons location ', Session.get('userLocationId'), userLocation);
		return userLocation;
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
		Session.set('searching', false);
		console.log('locations events ',this);
		Session.set('radius', 50);
		var userLocation = Session.get('userLocation');
//		Meteor.call('getLocations','list');
		console.log('locations events ', Session.get('userLocation'));	
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