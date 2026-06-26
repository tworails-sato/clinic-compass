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

  useEffect(() => {
    const savedProfile = window.sessionStorage.getItem(storageKeys.profile);
    if (!savedProfile) {
      router.replace("/start");
      return;
    }
    setProfile(JSON.parse(savedProfile));
    const savedAnswers = window.sessionStorage.getItem(storageKeys.answers);
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
  }, [router]);

  const questions = useMemo(() => getQuestions(profile), [profile]);
  const themes = useMemo(() => getThemes(questions), [questions]);
  const answered = Object.keys(answers).length;

  function setAnswer(questionId: number, value: number) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    setError("");
    window.sessionStorage.setItem(storageKeys.answers, JSON.stringify(next));
  }

  function submit() {
    const missing = questions.find((q) => !answers[q.id]);
    if (missing) {
      setError(`未回答の設問があります。No.${missing.id}から回答してください。`);
      setTimeout(() => document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 10);
      return;
    }
    window.sessionStorage.setItem(storageKeys.answers, JSON.stringify(answers));
    router.push("/result");
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
            <button className="button compact" onClick={submit}>
              結果を見る
            </button>
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
                        <span>Q{q.id}</span>
                        {q.text}
                      </p>
                      <div className="scale">
                        {scale.map((label, i) => (
                          <label key={label}>
                            <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === i + 1} onChange={() => setAnswer(q.id, i + 1)} />
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
            <button className="button large" onClick={submit}>
              診断結果を見る →
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
