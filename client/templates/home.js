var FEATURED_COUNT = 4;

Template.home.helpers({
	currentplaces: function(){
		var lastPlace;
/* 		var currentresults = Session.get('gotPlaces');
		var google_places = currentresults.google_places.results; */
		var lastGeoLog = GeoLog.find({userId: Meteor.userId(), placeId: {$not: {$size: 0}}}, {sort: {timestamp: -1}}, {limit: 1}).fetch()[0];
		if (!lastGeoLog) {
			return {name: unknown};
		}
		console.log('home currentplaces lastGeoLog ', lastGeoLog);
		var placeId = lastGeoLog.placeId;	
		lastPlaces = MerchantsCache.find({place_id: placeId}).fetch();
		console.log('home currentplaces lastGeoLog ', lastPlaces, placeId);
		return lastPlaces;
	},
	status: function(){
		var lastGeoLog = GeoLog.find({userId: Meteor.userId(), placeId: {$not: {$size: 0}}}, {sort: {timestamp: -1}}, {limit: 1}).fetch()[0];
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
  }
});