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
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import kotlin.math.abs

class PetOverlayService : Service() {
  private var windowManager: WindowManager? = null
  private var petView: ImageView? = null
  private val handler = Handler(Looper.getMainLooper())
  private val channelId = "pokebeat_pet_presence"
  private val notificationId = 42025
  private var moving = true
  private var direction = 1
  private var verticalDirection = 1
  private var x = 18
  private var y = 210
  private val motion = object : Runnable {
    override fun run() {
      val view = petView
      val manager = windowManager
      if (moving && view != null && manager != null) {
        val metrics = resources.displayMetrics
        x += direction * 3
        y += verticalDirection
        if (x > 170 || x < 8) direction *= -1
        if (y > metrics.heightPixels - 460 || y < 150) verticalDirection *= -1
        val params = view.layoutParams as WindowManager.LayoutParams
        params.x = x
        params.y = y
        try { manager.updateViewLayout(view, params) } catch (_: Exception) { }
      }
      handler.postDelayed(this, 45L)
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    if (Build.VERSION.SDK_INT >= 34) startForeground(notificationId, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(notificationId, buildNotification())
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
      .setContentText("Tu mascota camina y responde a tus toques.")
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
      setPadding(0, 0, 0, 0)
      setBackgroundColor(0xCC211D38.toInt())
      contentDescription = "Mascota PokéBeat"
    }
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE
    val params = WindowManager.LayoutParams(190, 220, type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT).apply {
      gravity = Gravity.TOP or Gravity.END
      x = this@PetOverlayService.x
      y = this@PetOverlayService.y
    }
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    petView?.setOnTouchListener { view: View, event: MotionEvent ->
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> { moving = false; downX = event.rawX; downY = event.rawY; startX = params.x; startY = params.y; true }
        MotionEvent.ACTION_MOVE -> { params.x = startX - (event.rawX - downX).toInt(); params.y = startY + (event.rawY - downY).toInt(); x = params.x; y = params.y; windowManager?.updateViewLayout(view, params); true }
        MotionEvent.ACTION_UP -> { val tapped = abs(event.rawX - downX) < 18 && abs(event.rawY - downY) < 18; if (tapped) Toast.makeText(this, "¡Pikachu te reconoce! Tócalo desde la app para cuidarlo.", Toast.LENGTH_SHORT).show(); moving = true; true }
        else -> true
      }
    }
    try { windowManager?.addView(petView, params); handler.post(motion) } catch (_: Exception) { stopSelf() }
  }

  override fun onDestroy() {
    moving = false
    handler.removeCallbacksAndMessages(null)
    petView?.let { try { windowManager?.removeView(it) } catch (_: Exception) {} }
    petView = null
    windowManager = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
