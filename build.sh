meteor build ../build --server=kn42.meteor.com
cd ../build/android/
jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 unaligned.apk Kn42
rm production.apk
/home/ipstas/.meteor/android_bundle/android-sdk/build-tools/21.0.0/zipalign 4 unaligned.apk production.apk
