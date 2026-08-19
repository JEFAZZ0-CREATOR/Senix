import React, { useState, useEffect } from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "./firebase";

export default function Auth({ onUser }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      onUser && onUser(u);
    });
    return () => unsub();
  }, [onUser]);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert("Error sign-in: " + e.message);
    }
  };
  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert("Error sign-up: " + e.message);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user)
    return (
      <div className="auth">
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSignIn}>Iniciar sesión</button>
        <button onClick={handleSignUp}>Crear cuenta</button>
      </div>
    );

  return (
    <div className="auth">
      <div>Conectado: {user.email}</div>
      <button onClick={handleSignOut}>Cerrar sesión</button>
    </div>
  );
}
