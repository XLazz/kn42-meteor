var feedSubscription;

// Handle for launch screen possibly dismissed from app-body.js
dataReadyHold = null;

// Global subscriptions
/* if (Meteor.isClient) {
  Meteor.subscribe('news');
  Meteor.subscribe('bookmarkCounts');
  feedSubscription = Meteor.subscribe('feed');
} */

Router.configure({
  layoutTemplate: 'appBody',
  notFoundTemplate: 'notFound'
});

if (Meteor.isClient) {
  // Keep showing the launch screen on mobile devices until we have loaded
  // the app's data
  dataReadyHold = LaunchScreen.hold();
}

HomeController = RouteController.extend({
  onBeforeAction: function() {
/*     Meteor.subscribe('latestActivity', function() {
      dataReadyHold.release();
    }); */
		this.next();
  } 
});

/* FeedController = RouteController.extend({
  onBeforeAction: function() {
    this.feedSubscription = feedSubscription;
  }
}); */

/* RecipesController = RouteController.extend({
  data: function() {
    return _.values(RecipesData);
  }
}); */

BookmarksController = RouteController.extend({
  onBeforeAction: function() {
    if (Meteor.user())
      Meteor.subscribe('bookmarks');
    else
      Overlay.open('authOverlay');
			this.next();
  },
/*   data: function() {
    if (Meteor.user())
      return _.values(_.pick(RecipesData, Meteor.user().bookmarkedRecipeNames));
  } */
});

/* RecipeController = RouteController.extend({
  onBeforeAction: function() {
    Meteor.subscribe('recipe', this.params.name);
  },
  data: function() {
    return RecipesData[this.params.name];
  }
}); */

AdminController = RouteController.extend({
  onBeforeAction: function() {
    Meteor.subscribe('news');
		this.next();
  }
});

/* Router.map(function() {
  this.route('home', {
		path: '/',
		waitOn: function () {
			return Experiences.find({});
		}
	});
	this.route('about', {path: '/about'});
  this.route('geolog');
	this.route('friends');
//	this.route('entrySignOut', {path: '/sign-out'});
  this.route('lifelog');
  this.route('temp'); 
  this.route('setnews'); 
  this.route('internal'); 
}); */

Router.route('/', {name: 'home'});
Router.route('/profile', {name: 'about'});
Router.route('/geolog', {name: 'geolog'});
Router.route('/lifelog', {name: 'lifelog'});
Router.route('/setnews', {name: 'setnews'});
Router.route('/friends', {name: 'friends'});
Router.route('/temp', {name: 'temp'});
Router.route('/autolog', {name: 'autolog'});
Router.route('/fitness', {name: 'fitness'});
Router.route('/music', function () { this.render('temp')});
/* Router.onBeforeAction('dataNotFound', {only: 'recipe'}); */
