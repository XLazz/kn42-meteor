var FEATURED_COUNT = 4;

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
  featuredRecipes: function() {
    var recipes = _.values(RecipesData);
    var selection = [];
    
    for (var i = 0;i < FEATURED_COUNT;i++)
      selection.push(recipes.splice(_.random(recipes.length - 1), 1)[0]);
    return selection;
  },
  
  activities: function() {
    return Activities.latest();
  },
  
  latestNews: function() {
    return News.latest();
  },
});

Template.home.events({
	/* 'click .change': function (event, template) {
		var place_id = $(event.currentTarget).attr("id");
		Session.set('radius', 50);
		console.log('chenging place ', place_id);
//		var userLocationId = $(event.currentTarget).attr("id");
//		Meteor.call('getLocations','list');

		return Session.set('changeplace', true);
	},
	
	'click .confirm': function (event, template) {
//		var userLocationId = $(event.currentTarget).attr("id");
//		Meteor.call('getLocations','list');
		var place_id = $(event.currentTarget).attr("id");
		var myPlace = MerchantsCache.findOne({place_id: place_id}, {fields: {_id: 0}});		
		var myId = Places.findOne({place_id: place_id}, {fields: {_id: 1}});		
		console.log('confirming place_id ', place_id, myPlace, myId );
		myPlace.confirmed = 1;
		if (myId) {
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

	"click #experience": function (event, template) {
		Overlay.show('selectExperience');	
	},	 */
});

Template.homeinside.helpers({
	currentplaces: function(){
		if (!Meteor.userId()) {return;};
//		if (!Session.get('changeplace')) {return};
		var lastPlaces;		
		if (!lastPlaces) {
			return UserLocations.findOne({
				userId: Meteor.userId(), place_id: {$not: {$size: 0}}
			}, {
				sort: {started: -1},
				transform: function(doc){
					var content = Places.findOne({place_id: doc.place_id});
					Session.set('userLocationId', doc.user_history_location_id);
					Session.set('currentPlace', doc.place_id);
					var olddoc = doc;
					doc.content = content;
//					Session.set('elsewhere', false);
					console.log('gotPlaces inside UserLocations transform for ', doc.place_id, _.extend(doc, _.omit(content, '_id')) );
//					return Session.set('changeplace', false);
					return _.extend(doc, _.omit(content, '_id'));
				}
			});
			console.log('home currentplaces lastPlaces 1 ', lastPlaces);
			return lastPlaces;
		}
//		lastPlaces.started = UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}}).started;
		console.log('home currentplaces lastPlaces 2 ', lastPlaces, place_id);
		return lastPlaces;
	},
	
	confirmationimage: function(){
		return {confirmationimage: '/icon/blank31.png'};
	},	
	
	placeconfirmed: function(){
		currentPlace = Places.findOne({place_id: Session.get('currentPlace'), confirmed: 1});
		console.log('experiences placeconfirmed ', currentPlace.place_id);
		return currentPlace;
	},
	
	status: function(){
		if (!Meteor.userId()) {return;};
		var lastGeoLog = GeoLog.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {timestamp: -1}});
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
	'click .change': function (event, template) {
		var place_id = $(event.currentTarget).attr("id");
		Session.set('radius', 50);
		console.log('chenging place ', place_id);
//		var userLocationId = $(event.currentTarget).attr("id");
//		Meteor.call('getLocations','list');
		return Session.set('changeplace', true);
	},
	
	'click .confirm': function (event, template) {
//		var userLocationId = $(event.currentTarget).attr("id");
//		Meteor.call('getLocations','list');
		var place_id = $(event.currentTarget).attr("id");
		var myPlace = MerchantsCache.findOne({place_id: place_id}, {fields: {_id: 0}});		
		var myId = Places.findOne({place_id: place_id}, {fields: {_id: 1}});		
		console.log('confirming place_id ', place_id, myPlace, myId );
		myPlace.confirmed = 1;
		if (myId) {
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
		console.log('experiences Experiences ', UserLocations.findOne({user_history_location_id: userLocationId}).place_id, services.fetch());
		if (services.count()) {
			return services.fetch();
		}
		var services = Services.find({place_id: UserLocations.findOne({user_history_location_id: userLocationId}).place_id});
		console.log('experiences Services ', UserLocations.findOne({user_history_location_id: userLocationId}).place_id, services.fetch());
		if (services.count()) {
			return services.fetch();
		}
		var currentPlace = Places.findOne({place_id: UserLocations.findOne({user_history_location_id: userLocationId}).place_id});
		console.log('experiences Places ', UserLocations.findOne({user_history_location_id: userLocationId}).place_id, currentPlace.types);
		if (currentPlace.types){		
			return currentPlace.types;
		}
	},
});

Template.selectExperience.events({
	'submit form': function(event){
    event.preventDefault();
		var experiences = event.target.experience.value;
		var experiences = $.csv.toArray(experiences);
		console.log('experiences selectExperience.events ', experiences);
		experiences.forEach(function (item, index, array){
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
		});
		return experiences;
	},

});