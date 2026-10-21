package com.migrainedetector.beta

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray

/**
 * Lists the Bluetooth devices already bonded to this phone.
 *
 * This is the same list the system Bluetooth settings shows. A bonded
 * watch is often out of range, so it would never appear in a BLE scan, and
 * react-native-ble-plx has no way to read it.
 */
class BondedDevicesModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "BondedDevices"

  @ReactMethod
  fun isSupported(promise: Promise) {
    promise.resolve(adapter() != null)
  }

  @ReactMethod
  fun getBondedDevices(promise: Promise) {
    try {
      val manager =
        reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      val adapter = manager?.adapter
      if (adapter == null) {
        promise.resolve(Arguments.createArray())
        return
      }
      if (!adapter.isEnabled) {
        promise.resolve(Arguments.createArray())
        return
      }
      val devices: Set<BluetoothDevice> = try {
        adapter.bondedDevices
      } catch (error: SecurityException) {
        // BLUETOOTH_CONNECT was not granted.
        promise.reject("permission", "Bluetooth permission was not granted.", error)
        return
      }
      val result: WritableArray = Arguments.createArray()
      for (device in devices) {
        val entry = Arguments.createMap()
        entry.putString("id", device.address)
        entry.putString("name", safeName(device))
        entry.putString("type", bondStateName(device.bondState))
        result.pushMap(entry)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("bonded_devices", error.message, error)
    }
  }

  private fun adapter(): BluetoothAdapter? {
    val manager =
      reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    return manager?.adapter
  }

  private fun safeName(device: BluetoothDevice): String {
    return try {
      if (device.name != null) device.name else "Paired device"
    } catch (error: SecurityException) {
      "Paired device"
    }
  }

  private fun bondStateName(state: Int): String =
    when (state) {
      BluetoothDevice.BOND_BONDED -> "bonded"
      BluetoothDevice.BOND_BONDING -> "bonding"
      BluetoothDevice.BOND_NONE -> "none"
      else -> "unknown"
    }
}
