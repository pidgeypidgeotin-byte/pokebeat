package com.pokebeat.petsoverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
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
import kotlin.cos
import kotlin.sin
import kotlin.sqrt
import kotlin.random.Random

class PetOverlayService : Service() {
  private var windowManager: WindowManager? = null
  private var petView: ImageView? = null
  private val handler = Handler(Looper.getMainLooper())
  private val channelId = "pokebeat_pet_presence"
  private val notificationId = 42025
  private var moving = true
  private var direction = 1
  private var x = 40
  private var y = 260
  private var velocity = 5f
  private var phase = 0f
  private var idleUntil = 0L
  private var nextDecisionAt = 0L
  private val motion = object : Runnable {
    override fun run() {
      val view = petView
      val manager = windowManager
      if (view != null && manager != null) {
        val params = view.layoutParams as WindowManager.LayoutParams
        val metrics = resources.displayMetrics
        val now = System.currentTimeMillis()
        val maxX = (metrics.widthPixels - params.width - 8).coerceAtLeast(8)
        val maxY = (metrics.heightPixels - params.height - 110).coerceAtLeast(180)
        if (now >= nextDecisionAt) {
          if (moving) {
            moving = false
            idleUntil = now + Random.nextLong(900L, 2400L)
          } else if (now >= idleUntil) {
            moving = true
            direction = if (Random.nextBoolean()) 1 else -1
            velocity = Random.nextInt(3, 7).toFloat()
            nextDecisionAt = now + Random.nextLong(1800L, 4200L)
          }
        }
        phase += if (moving) 0.18f else 0.08f
        if (moving) {
          x += (direction * velocity).toInt()
          y += (sin(phase.toDouble()).toFloat() * 1.8f).toInt()
          if (x >= maxX) { x = maxX; direction = -1 }
          if (x <= 8) { x = 8; direction = 1 }
          y = y.coerceIn(180, maxY)
          view.rotation = sin(phase.toDouble()).toFloat() * 4.5f
          view.scaleX = 1f + sin(phase.toDouble()).toFloat() * 0.035f
          view.scaleY = 1f - sin(phase.toDouble()).toFloat() * 0.035f
        } else {
          view.rotation = sin(phase.toDouble()).toFloat() * 1.5f
          view.scaleX = 1f + sin(phase.toDouble()).toFloat() * 0.018f
          view.scaleY = 1f + sin(phase.toDouble()).toFloat() * 0.018f
        }
        params.x = x.coerceIn(8, maxX)
        params.y = y.coerceIn(180, maxY)
        try { manager.updateViewLayout(view, params) } catch (_: Exception) { }
      }
      handler.postDelayed(this, 50L)
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
      .setContentText("Tu mascota camina, descansa y responde a tus toques.")
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
      scaleType = ImageView.ScaleType.FIT_CENTER
      setBackgroundColor(Color.TRANSPARENT)
      setPadding(0, 0, 0, 0)
      contentDescription = "Mascota PokéBeat"
    }
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE
    val params = WindowManager.LayoutParams(260, 260, type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT).apply {
      gravity = Gravity.TOP or Gravity.START
      x = this@PetOverlayService.x
      y = this@PetOverlayService.y
    }
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    petView?.setOnTouchListener { view: View, event: MotionEvent ->
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> { moving = false; idleUntil = System.currentTimeMillis() + 1800L; downX = event.rawX; downY = event.rawY; startX = params.x; startY = params.y; true }
        MotionEvent.ACTION_MOVE -> { params.x = startX + (event.rawX - downX).toInt(); params.y = startY + (event.rawY - downY).toInt(); x = params.x; y = params.y; windowManager?.updateViewLayout(view, params); true }
        MotionEvent.ACTION_UP -> { val tapped = abs(event.rawX - downX) < 18 && abs(event.rawY - downY) < 18; if (tapped) { view.animate().rotationBy(if (direction > 0) 18f else -18f).setDuration(180L).start(); Toast.makeText(this, "¡Tu mascota reaccionó! Ábrela para cuidarla.", Toast.LENGTH_SHORT).show() }; moving = true; nextDecisionAt = System.currentTimeMillis() + 2600L; true }
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
