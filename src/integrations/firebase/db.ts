import { db } from "./client";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  limit,
  startAfter,
  documentId,
  onSnapshot,
} from "firebase/firestore";

// Profiles
export async function getProfiles() {
  const q = query(collection(db, "profiles"), orderBy("full_name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProfilesByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  // Firestore supports up to 10 elements in 'in' queries
  const q = query(collection(db, "profiles"), where(documentId(), "in", ids));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProfileById(id: string) {
  const d = await getDoc(doc(db, "profiles", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function updateProfile(id: string, data: any) {
  const ref = doc(db, "profiles", id);
  await setDoc(ref, { ...data }, { merge: true });
}

// Roles
export async function getUserRoles() {
  const snap = await getDocs(collection(db, "user_roles"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setUserRole(userId: string, role: string) {
  const ref = doc(db, "user_roles", userId);
  await setDoc(ref, { user_id: userId, role }, { merge: true });
}

// Carousel highlights
export async function getHighlights() {
  const q = query(collection(db, "carousel_highlights"), orderBy("position", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createHighlight(data: any) {
  const ref = collection(db, "carousel_highlights");
  // Position handling should be done client-side: caller should set position
  const docRef = await addDoc(ref, data);
  return docRef.id;
}

export async function updateHighlight(id: string, data: any) {
  const ref = doc(db, "carousel_highlights", id);
  await setDoc(ref, data, { merge: true });
}

export async function deleteHighlight(id: string) {
  const ref = doc(db, "carousel_highlights", id);
  await deleteDoc(ref);
}

export async function getMaxHighlightPosition() {
  const q = query(collection(db, "carousel_highlights"), orderBy("position", "desc"), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  const d = snap.docs[0].data();
  return d.position || 0;
}

// Radio helpers (live session, effects, loop tracks)
export async function getLiveSession() {
  const q = query(collection(db, "radio_live_session"), where("is_live", "==", true), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export function subscribeLiveSession(onChange: (session: any | null) => void) {
  const q = query(collection(db, "radio_live_session"), where("is_live", "==", true), limit(1));
  const unsub = onSnapshot(q, (snap) => {
    if (snap.empty) {
      onChange(null);
      return;
    }
    const d = snap.docs[0];
    onChange({ id: d.id, ...d.data() });
  });
  return unsub;
}

export function subscribeActiveLoopTrack(onChange: (track: any | null) => void) {
  const q = query(collection(db, "radio_loop_track"), where("is_active", "==", true), limit(1));
  const unsub = onSnapshot(q, (snap) => {
    if (snap.empty) {
      onChange(null);
      return;
    }
    const d = snap.docs[0];
    onChange({ id: d.id, ...d.data() });
  });
  return unsub;
}

export async function getArtists() {
  const q = query(collection(db, "artists"), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createArtist(data: any) {
  const ref = collection(db, "artists");
  const r = await addDoc(ref, { ...data, is_active: true, featured: false, created_at: new Date().toISOString() });
  return r.id;
}

export async function updateArtist(id: string, data: any) {
  const ref = doc(db, "artists", id);
  await setDoc(ref, { ...data }, { merge: true });
}

export async function deleteArtist(id: string) {
  const ref = doc(db, "artists", id);
  await deleteDoc(ref);
}

// Productions
export async function getProductions() {
  const q = query(collection(db, "productions"), orderBy("updated_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createProduction(data: any) {
  const ref = collection(db, "productions");
  const now = new Date().toISOString();
  const r = await addDoc(ref, { ...data, created_at: now, updated_at: now });
  return r.id;
}

export async function updateProduction(id: string, data: any) {
  const ref = doc(db, "productions", id);
  await setDoc(ref, { ...data, updated_at: new Date().toISOString() }, { merge: true });
}

export async function deleteProduction(id: string) {
  const ref = doc(db, "productions", id);
  await deleteDoc(ref);
}

// Counts and aggregates for dashboard
export async function getArtistsCount() {
  const snap = await getDocs(collection(db, "artists"));
  return snap.size;
}

export async function getProductionsCount() {
  const snap = await getDocs(collection(db, "productions"));
  return snap.size;
}

export async function getActiveProductionsCount() {
  const q = query(collection(db, "productions"), where("status", "==", "in_progress"));
  const snap = await getDocs(q);
  return snap.size;
}

export async function getBookingsCount() {
  const snap = await getDocs(collection(db, "schedule_bookings"));
  return snap.size;
}

export async function getRecentProductions(limitCount = 5) {
  const q = query(collection(db, "productions"), orderBy("created_at", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function upsertLiveSession(data: any) {
  // If there is an existing live session, update it; otherwise create new
  const existing = await getLiveSession();
  if (existing) {
    const ref = doc(db, "radio_live_session", existing.id);
    await setDoc(ref, { ...existing, ...data }, { merge: true });
    return existing.id;
  } else {
    const ref = collection(db, "radio_live_session");
    const r = await addDoc(ref, data);
    return r.id;
  }
}

export async function getSoundEffects() {
  const q = query(collection(db, "radio_sound_effects"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createSoundEffect(data: any) {
  const ref = collection(db, "radio_sound_effects");
  const r = await addDoc(ref, data);
  return r.id;
}

export async function deleteSoundEffect(id: string) {
  const ref = doc(db, "radio_sound_effects", id);
  await deleteDoc(ref);
}

export async function getActiveLoopTrack() {
  const q = query(collection(db, "radio_loop_track"), where("is_active", "==", true), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function deactivateAllLoopTracks() {
  const q = query(collection(db, "radio_loop_track"), where("is_active", "==", true));
  const snap = await getDocs(q);
  const promises: Promise<any>[] = [];
  snap.docs.forEach((d) => {
    promises.push(setDoc(doc(db, "radio_loop_track", d.id), { is_active: false }, { merge: true }));
  });
  await Promise.all(promises);
}

export async function createLoopTrack(data: any) {
  const ref = collection(db, "radio_loop_track");
  const r = await addDoc(ref, data);
  return r.id;
}

export async function removeLoopTrack(id: string) {
  const ref = doc(db, "radio_loop_track", id);
  await setDoc(ref, { is_active: false }, { merge: true });
}

// Schedule bookings
export async function getBookingsBetween(startISO: string, endISO: string) {
  const q = query(collection(db, "schedule_bookings"), orderBy("start_time", "asc"), where("start_time", ">=", startISO), where("start_time", "<", endISO));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserBookings(uid: string, fromISO: string, limitCount = 5) {
  const q = query(
    collection(db, "schedule_bookings"),
    where("user_id", "==", uid),
    where("start_time", ">=", fromISO),
    orderBy("start_time", "asc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createBooking(data: any) {
  const ref = collection(db, "schedule_bookings");
  const r = await addDoc(ref, { ...data, created_at: new Date().toISOString() });
  return r.id;
}

export async function updateBooking(id: string, data: any) {
  const ref = doc(db, "schedule_bookings", id);
  await setDoc(ref, { ...data }, { merge: true });
}

export async function deleteBooking(id: string) {
  const ref = doc(db, "schedule_bookings", id);
  await deleteDoc(ref);
}

// Messages
export async function getMessagesForUser(uid: string, limitCount = 10) {
  // Firestore doesn't support OR queries; do two queries and merge
  const q1 = query(collection(db, "messages"), where("sender_id", "==", uid), orderBy("created_at", "desc"), limit(limitCount));
  const q2 = query(collection(db, "messages"), where("recipient_id", "==", uid), orderBy("created_at", "desc"), limit(limitCount));
  const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const items = [...s1.docs.map((d) => ({ id: d.id, ...d.data() })), ...s2.docs.map((d) => ({ id: d.id, ...d.data() }))];
  items.sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  return items.slice(0, limitCount);
}

export async function createMessage(data: any) {
  const ref = collection(db, "messages");
  const r = await addDoc(ref, { ...data, is_read: data.is_read || false, created_at: new Date().toISOString() });
  return r.id;
}

export async function markMessageRead(id: string) {
  const ref = doc(db, "messages", id);
  await setDoc(ref, { is_read: true }, { merge: true });
}

export function subscribeIncomingMessages(uid: string, onMessage: (m: any) => void) {
  const q = query(collection(db, "messages"), where("recipient_id", "==", uid), orderBy("created_at", "desc"));
  const unsubscribe = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        onMessage({ id: change.doc.id, ...change.doc.data() });
      }
    });
  });
  return unsubscribe;
}
