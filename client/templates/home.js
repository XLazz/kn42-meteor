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
	
	currentplaces: function(){
		if (!Meteor.userId()) {return;};
//		if (!Session.get('changeplace')) {return};
		var ready = Meteor.subscribe('UserLocations').ready();
		if (!UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}})) {
			//empty UserLocations, lets load from php
			Meteor.call('getLocations', Meteor.userId(), 'list');
		}
//		console.log('currentplaces before findOne ', i++, UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}) );
		var places = UserLocations.findOne({
			userId: Meteor.userId(), place_id: {$not: {$size: 0}}
		}, {
			sort: {started: -1},
			transform: function(doc){
				var content = Places.findOne({place_id: doc.place_id});
				Session.set('userLocationId', doc.user_history_location_id);
					if (!content) {
					content = MerchantsCache.findOne({place_id: doc.place_id});
				}
				if (!content) {
					console.log('no content, going for call to getPlaces');
					Meteor.call( 'getPlaces', Meteor.userId(), doc, 50);
				}
				var olddoc = doc;
				doc.content = content;
//				console.log('gotPlaces inside UserLocations transform for ', doc.place_id, _.extend(doc, _.omit(content, '_id')) );
				return _.extend(doc, _.omit(content, '_id'));
			}
		});
		if (!places) {return;}
		places['timespent'] = moment(places.started).fromNow();
//		ready = places.ready();
		
//		lastPlaces.started = UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}).started;
//		console.log('home currentplaces lastPlaces 2 ', ready, places);
		return places;
		
	},
	
	placeconfirmed: function(){
		currentPlace = UserLocations.findOne({user_history_location_id: Session.get('userLocationId'), confirmed: 1});
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
	
	'click .confirm': function (event, template) {
//		var userLocationId = $(event.currentTarget).attr("id");
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
	},

	"click .expselect": function (event, template) {
		Session.set('showexp', true);
	},	
});

Template.selectExperience.helpers({
	experiences: function(){
		userId = Meteor.userId();
		var userLocationId = Session.get('userLocationId');
//		var currentPlaceId = UserLocations.findOne({user_history_location_id: userLocationId}).place_id;
		var services = Experiences.find({ place_id: UserLocations.findOne({user_history_location_id: userLocationId}).place_id , userId: userId });
		console.log('experiences Experiences ', Session.get('userLocationId'), UserLocations.findOne({user_history_location_id: userLocationId}).place_id, services.fetch());
		if (services.count()) {
			console.log('experiences return ', services.fetch());
			return services.fetch();
		}
		var services = Services.find({place_id: UserLocations.findOne({user_history_location_id: userLocationId}).place_id});
		console.log('experiences Services ', UserLocations.findOne({user_history_location_id: userLocationId}).place_id, services.fetch());
		if (services.count()) {
			return services.fetch();
		}
	},
	types: function(){
		userId = Meteor.userId();
		var userLocationId = Session.get('userLocationId');
		var currentPlace = Places.findOne({place_id: UserLocations.findOne({user_history_location_id: userLocationId}).place_id});
		console.log('experiences Places ', UserLocations.findOne({user_history_location_id: userLocationId}).place_id, currentPlace);
		if (currentPlace){		
			return currentPlace.types;
		}
	},
	
	currentPlace: function() {
		return Session.get('userLocationId');
	},
});

Template.selectExperience.events({
	'submit form': function(event){
    event.preventDefault();
		console.log(event.target.selected);
		var experience = $( "#select-" + Session.get('userLocationId') +"-empty").val();
//		var experiences = $.csv.toArray(experiences);
		console.log('experiences selectExperience.events ', experience);
		Experiences.insert({
			userId: Meteor.userId(),
			experience: experience,
			place_id: UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}).place_id,
//			user_history_location_id: Session.get('userLocationId'),
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