// Write your package code here!
/**
 * This is an abstraction lib for handling backgrounded processes for GPS updates
 *
 * Source:
 *   https://github.com/christocracy/cordova-plugin-background-geolocation
 *
 * common:
 *   GeolocationBG2.setup()
 *     [true/false] is this available and setup?
 *   GeolocationBG2.config(options)
 *     getter/setter
 *   GeolocationBG2.start()
 *     start background process
 *   GeolocationBG2.stop()
 *     stop  background process
 *   GeolocationBG2.get()
 *     get the current location (handy shortcut)
 *
 * internal
 *   GeolocationBG2.setup()
 *   GeolocationBG2.send()
 *     [internal, non-android]
 *   GeolocationBG2.sendCallback()
 *     POSTs to the configured URL
 *     submits "data" as JSON content
 */
GeolocationBG2 = {
  // configure these options via GeolocationBG2.config()
  //  - options are passed into the config for Android background process
  //    - https://github.com/christocracy/cordova-plugin-background-geolocation
  //  - options are passed into HTTP.get()
  //    - https://github.com/meteor/meteor/blob/master/packages/http/httpcall_client.js
  options: {
    // your server url to send locations to
    //   YOU MUST SET THIS TO YOUR SERVER'S URL
    //   (see the setup instructions below)
    url: 'http://example.com/api/geolocation',
    params: {
      // will be sent in with 'location' in POST data (root level params)
      // these will be added automatically in setup()
      //userId: GeolocationBG2.userId(),
      //uuid:   GeolocationBG2.uuid(),
      //device: GeolocationBG2.device()
    },
    headers: {
      // will be sent in with 'location' in HTTP Header data
    },
    desiredAccuracy: 20,
    stationaryRadius: 30,
    distanceFilter: 30,
    // Android ONLY, customize the title of the notification
    notificationTitle: 'KN42 Background GPS',
    // Android ONLY, customize the text of the notification
    notificationText: 'ENABLED',
    //
    activityType: 'AutomotiveNavigation',
    // enable this hear sounds for background-geolocation life-cycle.
    debug: false
  },

  // placeholders
  bgGeo: null,
  fgGeo: null,
  isStarted: false,

  // start background service
  start: function() {
    if (!this.isStarted) {
      this.get();
    }
    if (!this.setup()) {
      console.error('GeolocationBG2 unable to setup, unable to start');
      return false;
    }
    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    this.bgGeo.start();
    this.isStarted = true;
		console.log('bgGeo started ', this);
    return true;
  },

  // stop background service
  stop: function() {
    if (!this.setup()) {
      console.error('GeolocationBG2 unable to setup, unable to stop');
      return false;
    }
    this.bgGeo.stop()
    this.isStarted = false;
    return true;
  },

  // where is this plugin available?
  //   get it whereever we can find it, and assign it to this.bgGeo
  getPlugin: function() {
    if (_.isObject(this.bgGeo)) {
      return this.bgGeo;
    }
    console.log('backgroundGeoLocation ~ ' + typeof backgroundGeoLocation);
    if (typeof backgroundGeoLocation == "object") {
      this.bgGeo = backgroundGeoLocation || null;
      if (_.isObject(this.bgGeo)) {
        return this.bgGeo;
      }
    }
    console.log('window.backgroundGeoLocation ~ ' + typeof window.backgroundGeoLocation);
    if (typeof window.backgroundGeoLocation == "object") {
      this.bgGeo = window.backgroundGeoLocation || null;
      if (_.isObject(this.bgGeo)) {
        return this.bgGeo;
      }
    }
    if (typeof window.plugins == "object") {
      console.log('window.plugins.backgroundGeoLocation ~ ' + typeof window.plugins.backgroundGeoLocation);
      if (typeof window.plugins.backgroundGeoLocation == "object") {
        this.bgGeo = window.plugins.backgroundGeoLocation || null;
        if (_.isObject(this.bgGeo)) {
          return this.bgGeo;
        }
      }
    }
    if (typeof cordova != "object") {
      console.error('No cordova object in global scope');
      return false;
    }
    console.log('cordova.backgroundGeoLocation ~ ' + typeof cordova.backgroundGeoLocation);
    if (typeof cordova.backgroundGeoLocation == "object") {
      this.bgGeo = cordova.backgroundGeoLocation || null;
      if (_.isObject(this.bgGeo)) {
        return this.bgGeo;
      }
    }
    if (typeof cordova.plugins == "object") {
      console.log('cordova.plugins.backgroundGeoLocation ~ ' + typeof cordova.plugins.backgroundGeoLocation);
      if (typeof cordova.plugins.backgroundGeoLocation == "object") {
        this.bgGeo = cordova.plugins.backgroundGeoLocation || null;
        if (_.isObject(this.bgGeo)) {
          return this.bgGeo;
        }
      }
    }
for (var key in window) {
  console.log('  window.' + key + ' ~ ' + typeof window[key]);
}
  },

  /**
   * Configuration getter and setter
   */
  config: function(options) {
    if (_.isString(options)) {
      this.options.url = options;
      return this.options;
    }
    if (!_.isObject(options)) {
      return this.options;
    }
    this.options = _.extend({}, this.options, options);
    return this.options;
  },

  /**
   * Setup the common usage for this plugin
   */
  setup: function() {
    if (!_.isNull(this.bgGeo)) {
      return true;
    }
    this.getPlugin();
    if (!_.isObject(this.bgGeo)) {
      console.log('GeolocationBG2.setup failed = not avail');
      return false;
    }
    // update the options with automatic params
    //   params will be sent in with 'location' in POST data (root level params)
    this.options.params.userId = GeolocationBG2.userId();
    this.options.params.uuid = GeolocationBG2.uuid();
    this.options.params.device = GeolocationBG2.device();

    // This callback will be executed every time a geolocation is recorded in the background.
    //   not used for Android
    var callbackFn = function(location) {
      console.log('GeolocationBG2: setup: callbackFn: ' + _.values(location).join(','));
      console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
      // Do your HTTP request here to POST location to your server.
      GeolocationBG2.send(location);
    };

    // This callback will be executed for error
    //   not used for Android
    var failureFn = function(error) {
      console.log('GeolocationBG2: setup: failureFn: ' + _.values(error).join(','));
      console.log('BackgroundGeoLocation error');
    }


    // BackgroundGeoLocation is highly configurable.
    // (NOTE: Android service is automatic)
    GeolocationBG2.bgGeo.configure(callbackFn, failureFn, this.options);

    console.log('GeolocationBG2: setup: end');
    return true;
  },

  /**
   * Send the location via AJAX to GeolocationBG2.url
   *
   * @param object location
   */
  send: function(location) {
    console.log('GeolocationBG2: send: init');

    if (!_.isObject(location) || !_.has(location.coords, 'longitude')) {
      console.error('GeolocationBG2: send: error - location is invalid');
			console.log('GeolocationBG2: send: error - location is invalid', location);
      return;
    } else {
			console.log('GeolocationBG2: send: OK ', location.coords.longitude);
			
		}

    var options = _.extend({
      data: {
        longitude: location.longitude,
        latitude: location.latitude,
        userId: GeolocationBG2.userId(),
        uuid: GeolocationBG2.uuid(),
        device: GeolocationBG2.device()
      }
    }, this.options);

		console.log('GeoLog.insert: ', options);
/*		GeoLog.insert(
			options
		);*/			
/*    HTTP.call('POST', this.options.url, options, function(res) {
      this.sendCallback(res);
    });*/
  },

  /**
   * Send the location via AJAX to GeolocationBG2.url
   *
   * @param object location
   */
  sendCallback: function(res) {
    console.log('GeolocationBG2: send: success: ' + res);
    console.log('[js] BackgroundGeoLocation callback, callback = success' + res);
    //
    // IMPORTANT:  You must execute the #finish method here to inform the native plugin that you're finished,
    //  and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
    // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
    //
    GeolocationBG2.bgGeo.finish();
  },

  /**
   * get the userId
   *
   * @param object location
   */
  userId: function() {
    if (!Meteor) {
      return 'noMeteorObj';
    }
    if (!_.has(Meteor, 'userId')) {
      return 'noMeteor.userId';
    }
    if (_.isString(Meteor.userId)) {
      return Meteor.userId;
    }
    return Meteor.userId();
  },

  /**
   * get the device info basics (tie back to user)
   *
   * @param object location
   */
  device: function() {
    device = device || {};
    if (!_.isObject(device)) {
      return 'errDeviceNotObject';
    }
    if (!_.has(device, 'platform')) {
      device.platform = '?';
    }
    if (!_.has(device, 'model')) {
      device.model = '?';
    }
    if (!_.has(device, 'version')) {
      device.version = '?';
    }
		console.log('GeolocationBG2: device : ', device.model);
    return device.platform + '(' + device.model + ') [' + device.version + ']';
  },

  /**
   * get the device info basics (tie back to user)
   *
   * @param object location
   */
  uuid: function() {
    device = device || {};
    if (!_.isObject(device)) {
      return 'errDeviceNotObject';
    }
    if (!_.has(device, 'uuid')) {
      device.uuid = '?';
    }
    return device.uuid;
  },

  /**
   * Get the navigator.geolocation plugin (foreground)
   *
   */
  getPluginFG: function() {
    if (_.isObject(this.fgGeo)) {
      return this.fgGeo;
    }
    this.fgGeo = window.navigator.geolocation || null;
    if (_.isObject(this.fgGeo)) {
      return this.fgGeo;
    }
    this.fgGeo = navigator.geolocation || null;
    if (_.isObject(this.fgGeo)) {
      return this.fgGeo;
    }
    this.fgGeo = geolocation || null;
    if (_.isObject(this.fgGeo)) {
      return this.fgGeo;
    }
    console.error('navigator.geolocation does not exist');
  },

  /**
   * Get the current/realtime location (not in BG)
   *
   * Your app must execute AT LEAST ONE call for the current position via standard Cordova geolocation,
   * in order to prompt the user for Location permission.
   */
  get: function() {
    console.log('GeolocationBG2: get: init');
    this.getPluginFG();
    if (!_.isObject(this.fgGeo)) {
      console.error('GeolocationBG2: get: failure... navigator.geolocation not available');
      return;
    }
    this.fgGeo.getCurrentPosition(function(location) {
      console.log('GeolocationBG2: get: got');
      GeolocationBG2.send(location);
    });
  }

}