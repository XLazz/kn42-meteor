var FEATURED_COUNT = 4;

Template.home.helpers({
	currentplaces: function(){
		if (!Meteor.userId()) {return;};
		var lastPlaces;
/* 		var currentresults = Session.get('gotPlaces');
		var google_places = currentresults.google_places.results; */
//		var lastGeoLog = GeoLog.find({userId: Meteor.userId(), placeId: {$not: {$size: 0}}}, {sort: {timestamp: -1}}, {limit: 1}).fetch()[0];
		var lastGeoLog = UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}});
		if (!lastGeoLog) {
			return {name: 'unknown'};
		}
		console.log('home currentplaces lastGeoLog ', lastGeoLog);
		var placeId = lastGeoLog.place_id;	
		Session.set('userLocationId', lastGeoLog.user_history_location_id);
		lastPlaces = Places.findOne({place_id: placeId});
		if (!lastPlaces) {
			lastPlaces = MerchantsCache.find(
				{
					place_id: UserLocations.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {started: -1}})
				}).fetch()[0];
			lastPlaces.started = lastGeoLog.started;
			console.log('home currentplaces lastPlaces ', lastPlaces, placeId);
			return lastPlaces;
		}
		lastPlaces.started = lastGeoLog.started;
		console.log('home currentplaces lastPlaces ', lastPlaces, placeId);
		return lastPlaces;
	},
	
	confirmationimage: function(){

		return {confirmationimage: '/icon/blank31.png'};
	},	
	status: function(){
		if (!Meteor.userId()) {return;};
		var lastGeoLog = GeoLog.findOne({userId: Meteor.userId(), placeId: {$not: {$size: 0}}}, {sort: {timestamp: -1}});
		return lastGeoLog.status;	
	},	
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
	
	changeplace: function(){
		return Session.get('changeplace');
	}
});

Template.home.events({
	'click #change': function (event, template) {
		Session.set('radius', 50);
//		var locationId = $(event.currentTarget).attr("id");
//		Meteor.call('getLocations','list');

		return Session.set('changeplace', true);
	},
});