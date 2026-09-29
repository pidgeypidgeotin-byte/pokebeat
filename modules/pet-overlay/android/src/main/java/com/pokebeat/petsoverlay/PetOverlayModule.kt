package com.pokebeat.petsoverlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PetOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PetOverlay")

    Function("canDrawOverlays") {
      Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(appContext.reactContext)
    }

    Function("openOverlaySettings") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      null
    }

    Function("start") { speciesId: Int?, accessToken: String? ->
      val context = appContext.reactContext ?: return@Function null
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) return@Function null
      val intent = Intent(context, PetOverlayService::class.java).apply { putExtra(PetOverlayService.EXTRA_SPECIES_ID, speciesId ?: 25); putExtra(PetOverlayService.EXTRA_SPOTIFY_TOKEN, accessToken ?: "") }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
      null
    }

    Function("stop") {
      val context = appContext.reactContext ?: return@Function null
      context.stopService(Intent(context, PetOverlayService::class.java))
      null
    }

    Function("consumePendingPlaybackMs") {
      val context = appContext.reactContext ?: return@Function 0.0
      val preferences = context.getSharedPreferences(PetOverlayService.PREFERENCES_NAME, 0)
      val pending = preferences.getLong(PetOverlayService.PENDING_PLAYBACK_MS, 0L)
      preferences.edit().putLong(PetOverlayService.PENDING_PLAYBACK_MS, 0L).apply()
      pending.toDouble()
    }
  }
}
