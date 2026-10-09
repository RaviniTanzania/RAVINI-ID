package com.ravini.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String NOTIFICATION_CHANNEL_ID = "ravini_default_channel";
    public static final String NOTIFICATION_CHANNEL_NAME = "RAVINI Notifications";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNativeNotificationChannel();
    }

    /**
     * Pre-register high-importance Android Notification Channel directly in OS
     * to ensure background and closed-app FCM push notifications trigger system sound,
     * vibration, and notification tray alerts seamlessly.
     */
    private void createNativeNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                NotificationChannel channel = notificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_ID);
                if (channel == null) {
                    channel = new NotificationChannel(
                        NOTIFICATION_CHANNEL_ID,
                        NOTIFICATION_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.setDescription("Arifa rasmi za mfumo wa RAVINI na maombi ya NIDA");
                    channel.enableVibration(true);
                    channel.setVibrationPattern(new long[]{0, 250, 250, 250});
                    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

                    Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build();
                    channel.setSound(defaultSoundUri, audioAttributes);

                    notificationManager.createNotificationChannel(channel);
                }
            }
        }
    }
}
