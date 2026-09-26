package com.pokebeat.petsoverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import androidx.core.app.NotificationCompat

class PetOverlayService : Service() {
  private var windowManager: WindowManager? = null
  private var petView: ImageView? = null
  private val channelId = "pokebeat_pet_presence"
  private val notificationId = 42025

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(notificationId, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(notificationId, buildNotification())
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) showPet()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, "Mascota PokéBeat", NotificationManager.IMPORTANCE_LOW)
      channel.description = "Mantiene visible la mascota virtual mientras escuchas música."
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply { addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP) }
    val pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    return NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.drawable.pikachu_overlay)
      .setContentTitle("PokéBeat está contigo")
      .setContentText("Tu mascota sigue visible mientras escuchas música.")
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  private fun showPet() {
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    petView = ImageView(this).apply {
      setImageResource(R.drawable.pikachu_overlay)
      scaleType = ImageView.ScaleType.CENTER_INSIDE
      setPadding(8, 8, 8, 8)
      setBackgroundColor(0xCC211D38.toInt())
      setOnClickListener { packageManager.getLaunchIntentForPackage(packageName)?.let { startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }
    }
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE
    val params = WindowManager.LayoutParams(96, 118, type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT).apply {
      gravity = Gravity.TOP or Gravity.END
      x = 12
      y = 180
    }
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    petView?.setOnTouchListener { view: View, event: MotionEvent ->
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> { downX = event.rawX; downY = event.rawY; startX = params.x; startY = params.y; true }
        MotionEvent.ACTION_MOVE -> { params.x = startX - (event.rawX - downX).toInt(); params.y = startY + (event.rawY - downY).toInt(); windowManager?.updateViewLayout(view, params); true }
        else -> false
      }
    }
    try { windowManager?.addView(petView, params) } catch (_: Exception) { stopSelf() }
  }

  override fun onDestroy() {
    petView?.let { try { windowManager?.removeView(it) } catch (_: Exception) {} }
    petView = null
    windowManager = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
