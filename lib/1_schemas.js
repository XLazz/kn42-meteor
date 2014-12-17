Schemas = {};

Meteor.isClient && Template.registerHelper("Schemas", Schemas);

Schemas.Person = new SimpleSchema({
  firstName: {
    type: String,
    index: 1,
    unique: true
  },
  lastName: {
    type: String,
    optional: true
  },
  age: {
    type: Number,
    optional: true
  }
});

Schemas.Experiences = new SimpleSchema({
  experience: {
    type: String,
    optional: true,
  },
  place_id: {
    type: String,
    optional: true,
    autoform: {
      type: "hidden",
		}
  },
  userId: {
    type: String,
    optional: true,
    autoform: {
      type: "hidden",
		}
  },
});

Schemas.FitnessActivities = new SimpleSchema({
  activity: {
    type: String,
/*     autoform: {
      afFieldInput: {
        type: "radio"
      }
    } */
  },
  date: {
    type: Date,
    optional: true,
    autoform: {
      type: "hidden",
		}
  },
  userId: {
    type: String,
    optional: true,
    autoform: {
      type: "hidden",
		}
  },
});

Schemas.ClaimForm = new SimpleSchema({
  name: {
    type: String,
  },
  created: {
    type: Date,
  },
  userId: {
    type: String,
  },
  'coords.latitude': {
		type: Number,
		decimal: true
  },
	'coords.longitude': {
		type: Number,
		decimal: true
	},
  'coords.latitude_harsh': {
		type: Number,
		decimal: true
  },
	'coords.longitude_harsh': {
		type: Number,
		decimal: true
	},
  place_id: {
    type: String,
  },
  type: {
    type: String,
  },

  'public': {
    type: String,
    autoform: {
      type: "boolean-radios",
			trueLabel: "Yes",
			falseLabel: "No",
      
    }
  }

});



/* Schemas.Item = new SimpleSchema({
  name: {
    type: String,
    index: 1,
    unique: true
  },
  tags: {
    type: String,
    optional: true
  }
}); */

/* Schemas.Select = new SimpleSchema({
  favoriteYear: {
    type: Number
  }
});

Schemas.SelectMultiple = new SimpleSchema({
  favoriteYears: {
    type: [Number]
  }
});

Schemas.FieldsExamples = new SimpleSchema({
  name: {
    type: String
  },
  phone: {
    type: String,
    optional: true
  },
  address: {
    type: Object
  },
  'address.street': {
    type: String
  },
  'address.street2': {
    type: String,
    optional: true
  },
  'address.city': {
    type: String
  },
  'address.state': {
    type: String,
    allowedValues: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"],
    autoform: {
      afFieldInput: {
        firstOption: "(Select a State)"
      }
    }
  },
  'address.postalCode': {
    type: String,
    label: "ZIP"
  },
  contacts: {
    type: Array,
    optional: true
  },
  'contacts.$': {
    type: Object
  },
  'contacts.$.name': {
    type: String
  },
  'contacts.$.phone': {
    type: String
  }
}); */
