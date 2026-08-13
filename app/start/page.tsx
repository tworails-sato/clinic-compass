"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { emptyProfile, Profile, roles, storageKeys } from "@/lib/assessment";
import { ParticipantType } from "@/lib/questions";

export default function StartPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [error, setError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(storageKeys.profile) ?? window.localStorage.getItem(storageKeys.profile);
    if (saved) setProfile({ ...emptyProfile, ...JSON.parse(saved) });
    setHasDraft(Boolean(window.localStorage.getItem(storageKeys.answers) || window.localStorage.getItem(storageKeys.draftId)));
  }, []);

  useEffect(() => {
    if (!profile.type) return;
    window.sessionStorage.setItem(storageKeys.profile, JSON.stringify(profile));
    window.localStorage.setItem(storageKeys.profile, JSON.stringify(profile));

    const draftId = getOrCreateDraftId();
    const timeout = window.setTimeout(() => {
      saveDraft(draftId, profile, getLocalAnswers()).catch((err) => {
        console.error("[clinic-compass] Profile draft save failed", err);
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [profile]);

  function updateProfile(next: Partial<Profile>) {
    setProfile((current) => ({ ...current, ...next }));
    setError("");
  }

  function start() {
    if (!profile.type) {
      setError("対象者区分を選択してください。");
      return;
    }

    window.sessionStorage.setItem(storageKeys.profile, JSON.stringify(profile));
    window.localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
    window.sessionStorage.removeItem(storageKeys.answers);
    window.localStorage.removeItem(storageKeys.answers);
    router.push("/questions");
  }

  function resumeDraft() {
    const savedProfile = window.localStorage.getItem(storageKeys.profile);
    const savedAnswers = window.localStorage.getItem(storageKeys.answers);
    const savedDraftId = window.localStorage.getItem(storageKeys.draftId);

    if (!savedProfile) {
      setError("再開できる途中保存データが見つかりませんでした。");
      setHasDraft(false);
      return;
    }

    const draftProfile = { ...emptyProfile, ...JSON.parse(savedProfile) } as Profile;
    if (!draftProfile.type) {
      setProfile(draftProfile);
      setError("途中保存データを読み込みました。対象者区分を選択してから設問へ進んでください。");
      return;
    }

    window.sessionStorage.setItem(storageKeys.profile, JSON.stringify(draftProfile));
    if (savedAnswers) window.sessionStorage.setItem(storageKeys.answers, savedAnswers);
    if (savedDraftId) window.sessionStorage.setItem(storageKeys.draftId, savedDraftId);
    router.push("/questions");
  }

  return (
    <>
      <SiteHeader />
      <main className="main">
        <div className="wrap">
          <section className="card profile-card">
            <p className="step">STEP 1 / 診断選択</p>
            <h2>診断をはじめましょう</h2>
            <p className="lead">対象者区分に応じて、表示する設問が切り替わります。</p>
            <div className="roles">
              {(Object.keys(roles) as ParticipantType[]).map((type) => (
                <button
                  className={`role ${profile.type === type ? "active" : ""}`}
                  key={type}
                  onClick={() => updateProfile({ type })}
                  type="button"
                >
                  <strong>{roles[type][0]}</strong>
                  <span>{roles[type][1]}</span>
                </button>
              ))}
            </div>
            {error && <p className="error">{error}</p>}
            <div className="start-actions">
              <button className="button" onClick={start} type="button">
                設問へ進む →
              </button>
              {hasDraft && (
                <button className="button resume-button" onClick={resumeDraft} type="button">
                  途中から再開する
                </button>
              )}
            </div>
            <p className="resume-note">
              途中保存した場合は、同じ端末・同じブラウザで再開できます。タブやブラウザを閉じた場合、環境によっては、はじめからとなる場合があります。
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

function getOrCreateDraftId() {
  const existing = window.localStorage.getItem(storageKeys.draftId) || window.sessionStorage.getItem(storageKeys.draftId);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(storageKeys.draftId, next);
  window.sessionStorage.setItem(storageKeys.draftId, next);
  return next;
}

function getLocalAnswers() {
  const saved = window.sessionStorage.getItem(storageKeys.answers) ?? window.localStorage.getItem(storageKeys.answers);
  if (!saved) return {};
  try {
    return JSON.parse(saved) as Record<number, number>;
  } catch {
    return {};
  }
}

async function saveDraft(draftId: string, profile: Profile, answers: Record<number, number>) {
  await fetch("/api/assessments/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", draftId, profile, answers }),
  });
}
