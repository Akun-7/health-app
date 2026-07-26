import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import type { Device, Subscription } from 'react-native-ble-plx';
import {
  BLOOD_PRESSURE_SERVICE_UUID,
  BLOOD_PRESSURE_MEASUREMENT_UUID,
  PULSE_OXIMETER_SERVICE_UUID,
  PLX_CONTINUOUS_MEASUREMENT_UUID,
  parseBloodPressureMeasurement,
  parsePulseOximeterMeasurement,
} from '../ble/gatt';

export type BleReading =
  | { type: 'bloodPressure'; systolic: number; diastolic: number; pulse: number | null }
  | { type: 'spo2'; percent: number; pulse: number | null };

type BleContextValue = {
  supported: boolean;
  scanning: boolean;
  devices: Device[];
  connectedDevice: Device | null;
  connecting: boolean;
  lastReading: BleReading | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
};

const BleContext = createContext<BleContextValue | null>(null);

// react-native-ble-plx's native module doesn't exist on web, and isn't linked
// inside plain Expo Go — only in a custom dev client build. `new BleManager()`
// throws synchronously in both cases, so this must be try/catch'd rather than
// just checked via Platform.OS, or the whole app crashes on startup.
let manager: BleManager | null = null;
if (Platform.OS !== 'web') {
  try {
    manager = new BleManager();
  } catch {
    manager = null;
  }
}
const supported = manager !== null;

async function ensureAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function BleProvider({ children }: { children: React.ReactNode }) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastReading, setLastReading] = useState<BleReading | null>(null);
  const subscriptionsRef = useRef<Subscription[]>([]);

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.remove());
      manager?.destroy();
    };
  }, []);

  async function startScan() {
    if (!manager) return;
    const granted = await ensureAndroidPermissions();
    if (!granted) return;
    setDevices([]);
    setScanning(true);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error || !device || !device.name) return;
      setDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device]));
    });
  }

  function stopScan() {
    manager?.stopDeviceScan();
    setScanning(false);
  }

  function subscribeToKnownServices(device: Device) {
    const subs: Subscription[] = [];
    try {
      subs.push(
        device.monitorCharacteristicForService(BLOOD_PRESSURE_SERVICE_UUID, BLOOD_PRESSURE_MEASUREMENT_UUID, (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const parsed = parseBloodPressureMeasurement(characteristic.value);
          if (parsed) setLastReading({ type: 'bloodPressure', ...parsed });
        })
      );
    } catch {
      // Device doesn't expose the Blood Pressure service — expected for pulse oximeters.
    }
    try {
      subs.push(
        device.monitorCharacteristicForService(PULSE_OXIMETER_SERVICE_UUID, PLX_CONTINUOUS_MEASUREMENT_UUID, (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const parsed = parsePulseOximeterMeasurement(characteristic.value);
          if (parsed) setLastReading({ type: 'spo2', percent: parsed.spo2, pulse: parsed.pulse });
        })
      );
    } catch {
      // Device doesn't expose the Pulse Oximeter service — expected for BP cuffs.
    }
    subscriptionsRef.current = subs;
  }

  async function connect(deviceId: string) {
    if (!manager) return;
    stopScan();
    setConnecting(true);
    try {
      const device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);
      subscribeToKnownServices(device);
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (!manager || !connectedDevice) return;
    subscriptionsRef.current.forEach((sub) => sub.remove());
    subscriptionsRef.current = [];
    await manager.cancelDeviceConnection(connectedDevice.id).catch(() => {});
    setConnectedDevice(null);
    setLastReading(null);
  }

  const value = useMemo(
    () => ({ supported, scanning, devices, connectedDevice, connecting, lastReading, startScan, stopScan, connect, disconnect }),
    [scanning, devices, connectedDevice, connecting, lastReading]
  );

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const ctx = useContext(BleContext);
  if (!ctx) {
    throw new Error('useBle must be used within a BleProvider');
  }
  return ctx;
}
