// Provide defaults for Meteor.settings
//
// To configure your own Twitter keys, see:
//   https://github.com/meteor/meteor/wiki/Configuring-Twitter-in-Local-Market
if (typeof Meteor.settings === 'undefined')
  Meteor.settings = {};

_.defaults(Meteor.settings, {
/*   twitter: {
    consumerKey: "PLfrg2bUh0oL0asi3R2fumRjm", 
    secret: "sRI8rnwO3sx7xUAxNWTX0WEDWph3WEBHu6tTdJYQ5wVrJeVCCt"
  } */
});

ServiceConfiguration.configurations.remove({
  service: "google",
  service: "twitter"
});
/* ServiceConfiguration.configurations.insert({
  service: "twitter",
  consumerKey: Meteor.settings.twitter.consumerKey,
  secret: Meteor.settings.twitter.secret
}); */
ServiceConfiguration.configurations.insert({
  service: "google",
  clientId: "425515102646-2gmc62vumclel54pg72m8lelso9q0nl5.apps.googleusercontent.com",
  loginStyle: "popup",
  secret: "ipt73oPniDshxpJHoOsihBaM"
});