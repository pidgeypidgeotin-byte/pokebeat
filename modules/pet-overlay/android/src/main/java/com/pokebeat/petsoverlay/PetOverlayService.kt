package com.pokebeat.petsoverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
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
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.abs
import kotlin.math.sin
import kotlin.random.Random

class PetOverlayService : Service() {
  companion object {
    const val EXTRA_SPECIES_ID = "pokebeat_species_id"
    const val EXTRA_SPOTIFY_TOKEN = "pokebeat_spotify_token"
    const val PREFERENCES_NAME = "pokebeat_overlay_sync"
    const val PENDING_PLAYBACK_MS = "pending_playback_ms"
  }

  private var windowManager: WindowManager? = null
  private var petView: ImageView? = null
  private val handler = Handler(Looper.getMainLooper())
  private val channelId = "pokebeat_pet_presence"
  private val notificationId = 42025
  private var speciesId = 25
  private var moving = true
  private var direction = 1
  private var x = 40
  private var y = 260
  private var velocity = 2.2f
  private var phase = 0f
  private var animationFrame = 0
  private var idleUntil = 0L
  private var nextDecisionAt = 0L
  private var sheet: Bitmap? = null
  private var frameWidth = 0
  private var frameHeight = 0
  private var frameRows = 1
  private var spotifyToken = ""
  private var lastTrackId: String? = null
  private var lastProgressMs = 0L
  private var lastIsPlaying = false

  private val spotifyPoll = object : Runnable {
    override fun run() {
      if (spotifyToken.isNotBlank()) pollSpotifyPlayback()
      handler.postDelayed(this, 20_000L)
    }
  }

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
            idleUntil = now + Random.nextLong(2200L, 5200L)
          } else if (now >= idleUntil) {
            moving = true
            direction = if (Random.nextBoolean()) 1 else -1
            velocity = Random.nextDouble(1.8, 3.4).toFloat()
            nextDecisionAt = now + Random.nextLong(4200L, 9000L)
          }
        }
        phase += if (moving) 0.10f else 0.045f
        if (moving) {
          x += (direction * velocity).toInt().coerceAtLeast(if (direction < 0) -1 else 1)
          y += (sin(phase.toDouble()).toFloat() * 0.65f).toInt()
          if (x >= maxX) { x = maxX; direction = -1 }
          if (x <= 8) { x = 8; direction = 1 }
          y = y.coerceIn(180, maxY)
          view.rotation = sin(phase.toDouble()).toFloat() * 1.2f
          view.scaleX = 1f + sin(phase.toDouble()).toFloat() * 0.018f
          view.scaleY = 1f - sin(phase.toDouble()).toFloat() * 0.018f
        } else {
          view.rotation = sin(phase.toDouble()).toFloat() * 0.45f
          view.scaleX = 1f + sin(phase.toDouble()).toFloat() * 0.008f
          view.scaleY = 1f + sin(phase.toDouble()).toFloat() * 0.008f
        }
        animationFrame = (animationFrame + 1) % 3
        updateFrame(moving)
        params.x = x.coerceIn(8, maxX)
        params.y = y.coerceIn(180, maxY)
        try { manager.updateViewLayout(view, params) } catch (_: Exception) { }
      }
      handler.postDelayed(this, if (moving) 150L else 260L)
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    if (Build.VERSION.SDK_INT >= 34) startForeground(notificationId, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(notificationId, buildNotification())
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) showPet()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    speciesId = intent?.getIntExtra(EXTRA_SPECIES_ID, speciesId) ?: speciesId
    spotifyToken = intent?.getStringExtra(EXTRA_SPOTIFY_TOKEN).orEmpty()
    if (petView != null) loadSpeciesSprite()
    handler.removeCallbacks(spotifyPoll)
    handler.post(spotifyPoll)
    return START_STICKY
  }

  private fun pollSpotifyPlayback() {
    Thread {
      try {
        val connection = (URL("https://api.spotify.com/v1/me/player/currently-playing?market=ES&additional_types=track,episode").openConnection() as HttpURLConnection).apply {
          requestMethod = "GET"
          connectTimeout = 8_000
          readTimeout = 8_000
          setRequestProperty("Authorization", "Bearer $spotifyToken")
        }
        if (connection.responseCode == 200) {
          val payload = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
          val item = payload.optJSONObject("item")
          val trackId = item?.optString("id")?.takeIf { it.isNotBlank() }
          val progress = payload.optLong("progress_ms", 0L)
          val isPlaying = payload.optBoolean("is_playing", false)
          if (trackId != null && trackId == lastTrackId && lastIsPlaying && isPlaying && progress > lastProgressMs) {
            val delta = (progress - lastProgressMs).coerceAtMost(120_000L)
            val prefs = getSharedPreferences(PREFERENCES_NAME, 0)
            prefs.edit().putLong(PENDING_PLAYBACK_MS, prefs.getLong(PENDING_PLAYBACK_MS, 0L) + delta).apply()
          }
          lastTrackId = trackId
          lastProgressMs = progress
          lastIsPlaying = isPlaying
        }
        connection.disconnect()
      } catch (_: Exception) { }
    }.start()
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
      .setSmallIcon(R.drawable.pmd_0025)
      .setContentTitle("PokéBeat está contigo")
      .setContentText("Tu Pokémon camina, descansa y responde a tus toques.")
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  private fun showPet() {
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    petView = ImageView(this).apply {
      scaleType = ImageView.ScaleType.FIT_CENTER
      setPadding(0, 0, 0, 0)
      contentDescription = "Mascota PokéBeat"
    }
    loadSpeciesSprite()
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
        MotionEvent.ACTION_UP -> { val tapped = abs(event.rawX - downX) < 18 && abs(event.rawY - downY) < 18; if (tapped) { view.animate().rotationBy(if (direction > 0) 8f else -8f).setDuration(180L).start(); Toast.makeText(this, "¡Tu Pokémon reaccionó! Ábrelo para cuidarlo.", Toast.LENGTH_SHORT).show() }; moving = true; nextDecisionAt = System.currentTimeMillis() + 4200L; true }
        else -> true
      }
    }
    try { windowManager?.addView(petView, params); handler.post(motion) } catch (_: Exception) { stopSelf() }
  }

  private fun loadSpeciesSprite() {
    val safeId = speciesId.coerceIn(1, 151)
    val resourceName = "pmd_${safeId.toString().padStart(4, '0')}"
    val resourceId = resources.getIdentifier(resourceName, "drawable", packageName)
    val bitmap = BitmapFactory.decodeResource(resources, if (resourceId != 0) resourceId else R.drawable.pmd_0025) ?: return
    sheet?.recycle()
    sheet = bitmap
    frameRows = if (bitmap.width >= 3 * 16 && bitmap.height >= 10 * 16 && bitmap.height.toFloat() / bitmap.width > 2.4f) 10 else 1
    frameWidth = if (frameRows == 10) bitmap.width / 3 else bitmap.width
    frameHeight = if (frameRows == 10) bitmap.height / 10 else bitmap.height
    updateFrame(false)
  }

  private fun updateFrame(isWalking: Boolean) {
    val bitmap = sheet ?: return
    val view = petView ?: return
    if (frameRows == 1) { view.setImageBitmap(bitmap); return }
    val row = if (isWalking) 1 else 0
    val left = (animationFrame % 3) * frameWidth
    val top = (row % frameRows) * frameHeight
    view.setImageBitmap(Bitmap.createBitmap(bitmap, left, top, frameWidth, frameHeight))
  }

  override fun onDestroy() {
    moving = false
    handler.removeCallbacksAndMessages(null)
    petView?.let { try { windowManager?.removeView(it) } catch (_: Exception) {} }
    petView = null
    sheet?.recycle()
    sheet = null
    windowManager = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
