#meteor build ../build-dev --server=kn42dev.meteor.com
cd ../build-dev/android/
jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 unaligned.apk Kn42
rm production.apk
/home/ipstas/.meteor/android_bundle/android-sdk/build-tools/21.0.0/zipalign 4 unaligned.apk kn42-dev-met.apk
