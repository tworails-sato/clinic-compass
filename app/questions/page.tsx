"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Answers, emptyProfile, getQuestions, getThemes, Profile, roles, scale, storageKeys } from "@/lib/assessment";
import { ParticipantType } from "@/lib/questions";

export default function QuestionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => {
    const savedProfile = window.sessionStorage.getItem(storageKeys.profile) ?? window.localStorage.getItem(storageKeys.profile);
    if (!savedProfile) {
      router.replace("/start");
      return;
    }

    setProfile(JSON.parse(savedProfile));
    const savedAnswers = window.sessionStorage.getItem(storageKeys.answers) ?? window.localStorage.getItem(storageKeys.answers);
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
  }, [router]);

  const questions = useMemo(() => getQuestions(profile), [profile]);
  const themes = useMemo(() => getThemes(questions), [questions]);
  const displayNumberByQuestionId = useMemo(() => {
    const displayedQuestions = themes.flatMap((theme) => questions.filter((question) => question.theme === theme));
    return new Map(displayedQuestions.map((question, index) => [question.id, index + 1]));
  }, [questions, themes]);
  const answered = Object.keys(answers).length;

  function setAnswer(questionId: number, value: number) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    setError("");
    window.sessionStorage.setItem(storageKeys.answers, JSON.stringify(next));
    window.localStorage.setItem(storageKeys.answers, JSON.stringify(next));
    saveDraft(getOrCreateDraftId(), profile, next).catch((err) => {
      console.error("[clinic-compass] Answer draft save failed", err);
    });
  }

  async function saveDraftManually() {
    setDraftSaving(true);
    setDraftMessage("");
    setError("");
    window.sessionStorage.setItem(storageKeys.profile, JSON.stringify(profile));
    window.localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
    window.sessionStorage.setItem(storageKeys.answers, JSON.stringify(answers));
    window.localStorage.setItem(storageKeys.answers, JSON.stringify(answers));

    try {
      await saveDraft(getOrCreateDraftId(), profile, answers);
      setDraftMessage("途中保存しました");
      window.setTimeout(() => setDraftMessage(""), 3000);
    } catch (err) {
      console.error("[clinic-compass] Manual draft save failed", err);
      setError("途中保存に失敗しました。通信環境を確認し、再度お試しください。");
    } finally {
      setDraftSaving(false);
    }
  }

  async function submit() {
    const missing = questions.find((q) => !answers[q.id]);
    if (missing) {
      setError(`未回答の設問があります。No.${displayNumberByQuestionId.get(missing.id) ?? missing.id}から回答してください。`);
      setTimeout(() => document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 10);
      return;
    }

    setSaving(true);
    setError("");
    window.sessionStorage.setItem(storageKeys.answers, JSON.stringify(answers));
    window.localStorage.setItem(storageKeys.answers, JSON.stringify(answers));

    try {
      const response = await fetch("/api/assessments/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile, answers }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; responseId?: string };

      if (!response.ok || !data.ok) {
        setError(data.message || "診断結果を保存できませんでした。時間をおいて再度お試しください。");
        setSaving(false);
        return;
      }

      if (data.responseId) {
        window.sessionStorage.setItem(storageKeys.savedResponseId, data.responseId);
        await completeDraft(getOrCreateDraftId(), data.responseId);
      }

      window.localStorage.removeItem(storageKeys.profile);
      window.localStorage.removeItem(storageKeys.answers);
      window.localStorage.removeItem(storageKeys.draftId);
      router.push("/result");
    } catch (err) {
      console.error("[clinic-compass] Assessment completion request failed", err);
      setError("診断結果を保存できませんでした。通信環境を確認し、再度お試しください。");
      setSaving(false);
    }
  }

  if (!profile.type) return null;

  return (
    <>
      <SiteHeader />
      <main className="main assessment">
        <div className="wrap">
          <section className="assessment-head">
            <p className="step">STEP 2 / 回答</p>
            <h1>{roles[profile.type as ParticipantType][0]}向けアセスメント</h1>
            <p>
              {profile.clinic}　{profile.name}さん
            </p>
          </section>

          <div className="score-guide">
            <strong>回答の目安</strong>
            {scale.map((label, i) => (
              <span key={label}>
                <b>{i + 1}</b>
                {label}
              </span>
            ))}
          </div>

          <div className="sticky-progress">
            <div>
              <strong>回答状況</strong>
              <span>
                {questions.length}問中 {answered}問を回答
              </span>
            </div>
            <div className="progress">
              <i style={{ width: `${(answered / questions.length) * 100}%` }} />
            </div>
            <div className="sticky-actions">
              {draftMessage && <span className="draft-save-message">{draftMessage}</span>}
              <button className="button compact draft-save-button" onClick={saveDraftManually} disabled={saving || draftSaving} type="button">
                {draftSaving ? "保存中..." : "途中保存する"}
              </button>
              <button className="button compact" onClick={submit} disabled={saving || draftSaving} type="button">
                {saving ? "保存中..." : "結果を見る"}
              </button>
            </div>
          </div>

          {error && <div className="alert">{error}</div>}

          {themes.map((theme) => (
            <section className="card theme" key={theme}>
              <p className="theme-kicker">THEME</p>
              <h2>{theme}</h2>
              {questions
                .filter((q) => q.theme === theme)
                .map((q) => {
                  const missing = error && !answers[q.id];
                  return (
                    <article className={`question ${missing ? "unanswered" : ""}`} id={`q-${q.id}`} key={q.id}>
                      <p className="qtext">
                        <span>Q{displayNumberByQuestionId.get(q.id) ?? q.id}</span>
                        {q.text}
                        {q.note && <small className="qnote">{q.note}</small>}
                      </p>
                      <div className="scale">
                        {scale.map((label, i) => (
                          <label key={label}>
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === i + 1}
                              disabled={saving}
                              onChange={() => setAnswer(q.id, i + 1)}
                            />
                            <b>{i + 1}</b>
                            <small>{label}</small>
                          </label>
                        ))}
                      </div>
                    </article>
                  );
                })}
            </section>
          ))}

          <div className="submit-box">
            {error && <p className="error">{error}</p>}
            <button className="button large" onClick={submit} disabled={saving}>
              {saving ? "診断結果を保存中..." : "診断結果を見る →"}
            </button>
          </div>
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

async function saveDraft(draftId: string, profile: Profile, answers: Answers) {
  await fetch("/api/assessments/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", draftId, profile, answers }),
  });
}

async function completeDraft(draftId: string, responseId: string) {
  await fetch("/api/assessments/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete", draftId, responseId }),
  }).catch((err) => {
    console.error("[clinic-compass] Draft completion mark failed", err);
  });
}
