Template.signin.events({
  'click .kn-signin': function() {
    Meteor.loginWithGoogle({loginStyle: 'redirect'});
  }
});