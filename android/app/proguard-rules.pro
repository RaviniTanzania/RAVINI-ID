# Proguard rules for RAVINI Android Application
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.getcapacitor.** { *; }
-keep class com.google.firebase.** { *; }
