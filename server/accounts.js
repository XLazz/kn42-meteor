  Meteor.startup(function () {
    AccountsEntry.config({
//      signupCode: 's3cr3t',         // only restricts username+password users, not OAuth
/*       defaultProfile:
          someDefault: 'default' */
    });
  });