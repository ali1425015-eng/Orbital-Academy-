#!/usr/bin/env python3
"""
Trains and evaluates the two ML models used by Orbital Academy, then exports
the deployable one to js/shared/model-weights.js (read by both the
browser and the server).

  Model 1  P(correct)        — picks questions in the student's "flow zone"
  Model 2  P(next rapid guess) — the focus assistant: triggers a micro-break
                                 before the student disengages

Data: research/sim-dataset.csv from ml/simulate.js (SIMULATED students —
real classroom data will replace it after a pilot study). The split is by
STUDENT (no student appears in both train and test).

For each model we compare:
  - a heuristic baseline (Elo only / 1 − focus)
  - logistic regression (deployed: tiny, transparent, runs in the browser)
  - gradient boosting (an upper bound to see what a heavier model would add)
"""
import json, os, sys, time
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, log_loss, brier_score_loss, accuracy_score, average_precision_score, roc_curve
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "research")
FIG = os.path.join(RES, "figures")
os.makedirs(FIG, exist_ok=True)

FEATURES = ["elo_diff", "mastery", "log_attempts", "recent_acc", "focus", "seen", "difficulty", "session_min", "grade_gap"]
DIS = ["focus", "session_min", "recent_rapid", "consec_wrong", "tab_switches", "elo_diff", "since_break_min"]
DIS_COLS = ["d_" + c for c in DIS]

t0 = time.time()
df = pd.read_csv(os.path.join(RES, "sim-dataset.csv"))
tr, te = df[df.split == "train"], df[df.split == "test"]
print(f"rows: {len(df):,}  (train {len(tr):,} / test {len(te):,})  students: {df.student.nunique():,}")

def ece(y, p, bins=10):
    edges = np.linspace(0, 1, bins + 1); e = 0.0; pts = []
    for i in range(bins):
        m = (p >= edges[i]) & (p < edges[i + 1] if i < bins - 1 else p <= 1)
        if m.sum() == 0: continue
        e += m.mean() * abs(y[m].mean() - p[m].mean()); pts.append((float(p[m].mean()), float(y[m].mean()), int(m.sum())))
    return float(e), pts

def metrics(y, p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    e, pts = ece(y, p)
    return {"auc": float(roc_auc_score(y, p)), "pr_auc": float(average_precision_score(y, p)), "log_loss": float(log_loss(y, p)),
            "brier": float(brier_score_loss(y, p)), "accuracy@0.5": float(accuracy_score(y, p >= 0.5)), "ece": e, "calibration": pts}

def export_lr(model, scaler, feats):
    return {"features": feats, "coef": [float(c) for c in model.coef_[0]], "intercept": float(model.intercept_[0]),
            "mean": [float(m) for m in scaler.mean_], "scale": [float(s) if s > 0 else 1.0 for s in scaler.scale_]}

report = {"data": {"rows": int(len(df)), "train_rows": int(len(tr)), "test_rows": int(len(te)), "students": int(df.student.nunique()),
                   "note": "Simulated learners (ml/simulate.js). Split by student."}}
curves = {}

# ---------------- Model 1: P(correct) ----------------
# Only engaged answers carry skill information; rapid guesses are excluded from training (same rule as the Elo update).
tr1, te1 = tr[tr.rapid == 0], te[te.rapid == 0]
Xtr, ytr, Xte, yte = tr1[FEATURES].values, tr1.correct.values, te1[FEATURES].values, te1.correct.values
base = 1 / (1 + np.exp(-te1.elo_diff.values))
sc = StandardScaler().fit(Xtr)
lr = LogisticRegression(max_iter=2000, C=1.0).fit(sc.transform(Xtr), ytr)
p_lr = lr.predict_proba(sc.transform(Xte))[:, 1]
gb = HistGradientBoostingClassifier(max_iter=250, learning_rate=0.08, max_leaf_nodes=31, random_state=1).fit(Xtr, ytr)
p_gb = gb.predict_proba(Xte)[:, 1]
p_const = np.full_like(p_lr, ytr.mean())
report["correct"] = {"baseline_constant": metrics(yte, p_const), "baseline_elo": metrics(yte, base), "logistic": metrics(yte, p_lr), "gradient_boosting": metrics(yte, p_gb),
                     "coefficients": dict(zip(FEATURES, [float(c) for c in lr.coef_[0]]))}
curves["correct"] = {"Elo only": base, "Logistic (deployed)": p_lr, "Gradient boosting": p_gb, "_y": yte}

# ---------------- Model 2: P(next answer is a rapid guess) ----------------
Xtr2, ytr2, Xte2, yte2 = tr[DIS_COLS].values, tr.next_rapid.values, te[DIS_COLS].values, te.next_rapid.values
base2 = 1 - te.d_focus.values
sc2 = StandardScaler().fit(Xtr2)
lr2 = LogisticRegression(max_iter=2000, C=1.0, class_weight=None).fit(sc2.transform(Xtr2), ytr2)
p_lr2 = lr2.predict_proba(sc2.transform(Xte2))[:, 1]
gb2 = HistGradientBoostingClassifier(max_iter=250, learning_rate=0.08, max_leaf_nodes=31, random_state=1).fit(Xtr2, ytr2)
p_gb2 = gb2.predict_proba(Xte2)[:, 1]
report["disengage"] = {"base_rate": float(yte2.mean()), "baseline_1_minus_focus": metrics(yte2, np.clip(base2, 0, 1)), "logistic": metrics(yte2, p_lr2),
                       "gradient_boosting": metrics(yte2, p_gb2), "coefficients": dict(zip(DIS, [float(c) for c in lr2.coef_[0]]))}
curves["disengage"] = {"1 − focus (heuristic)": np.clip(base2, 0, 1), "Logistic (deployed)": p_lr2, "Gradient boosting": p_gb2, "_y": yte2}

# Risk threshold used by the game: choose the threshold that flags the top-risk answers with precision ≥ 2× base rate.
ths = np.linspace(0.05, 0.9, 86); best = 0.5
for t in ths:
    m = p_lr2 >= t
    if m.sum() > 50 and yte2[m].mean() >= 2 * yte2.mean(): best = float(t); break
report["disengage"]["break_threshold"] = best
report["disengage"]["at_threshold"] = {"flagged_share": float((p_lr2 >= best).mean()), "precision": float(yte2[p_lr2 >= best].mean()) if (p_lr2 >= best).any() else 0.0,
                                       "recall": float(((p_lr2 >= best) & (yte2 == 1)).sum() / max(1, yte2.sum()))}

# ---------------- export ----------------
weights = {"version": time.strftime("%Y-%m-%d"), "trainedOn": "simulated learners (ml/simulate.js)",
           "correct": dict(export_lr(lr, sc, FEATURES), auc=report["correct"]["logistic"]["auc"]),
           "disengage": dict(export_lr(lr2, sc2, DIS), auc=report["disengage"]["logistic"]["auc"], threshold=best)}
js = ("/* AUTO-GENERATED by ml/train.py — do not edit. Logistic-regression weights.\n"
      "   Features are standardised with mean/scale before the dot product. */\n"
      "(function (root, factory) {\n  if (typeof module === 'object' && module.exports) module.exports = factory();\n"
      "  else (root.OA = root.OA || {}).Model = factory();\n})(typeof self !== 'undefined' ? self : this, function () {\n  return "
      + json.dumps(weights, indent=1) + ";\n});\n")
open(os.path.join(ROOT, "js", "shared", "model-weights.js"), "w").write(js)

for k in ("correct", "disengage"):
    for m in report[k].values():
        if isinstance(m, dict) and "calibration" in m: m["calibration"] = m["calibration"]
json.dump(report, open(os.path.join(RES, "ml-report.json"), "w"), indent=2)

# ---------------- figures ----------------
plt.rcParams.update({"figure.dpi": 130, "font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
COL = ["#8a94a6", "#2f7de1", "#e0663a"]
fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
for ax, (key, title) in zip(axes, [("correct", "Model 1 — will the student answer correctly?"), ("disengage", "Model 2 — will the next answer be a rapid guess?")]):
    y = curves[key]["_y"]
    for (name, p), c in zip([(k, v) for k, v in curves[key].items() if k != "_y"], COL):
        fpr, tpr, _ = roc_curve(y, p); ax.plot(fpr, tpr, color=c, lw=2, label=f"{name}  (AUC {roc_auc_score(y, p):.3f})")
    ax.plot([0, 1], [0, 1], ls=":", color="#bbb"); ax.set_title(title, fontsize=10); ax.set_xlabel("False positive rate"); ax.set_ylabel("True positive rate"); ax.legend(loc="lower right", fontsize=8, frameon=False)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "roc.png")); plt.close(fig)

fig, ax = plt.subplots(figsize=(5, 4.2))
for name, c in zip(["baseline_elo", "logistic", "gradient_boosting"], COL):
    pts = report["correct"][name]["calibration"]; ax.plot([p[0] for p in pts], [p[1] for p in pts], "o-", color=c, label=name.replace("_", " "))
ax.plot([0, 1], [0, 1], ls=":", color="#bbb"); ax.set_xlabel("Predicted P(correct)"); ax.set_ylabel("Observed share correct"); ax.set_title("Calibration — Model 1", fontsize=10); ax.legend(frameon=False, fontsize=8)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "calibration.png")); plt.close(fig)

fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))
for ax, (key, feats) in zip(axes, [("correct", FEATURES), ("disengage", DIS)]):
    co = report[key]["coefficients"]; order = sorted(feats, key=lambda f: co[f])
    ax.barh(order, [co[f] for f in order], color=["#e0663a" if co[f] < 0 else "#2f7de1" for f in order]); ax.axvline(0, color="#999", lw=.8)
    ax.set_title(("Model 1" if key == "correct" else "Model 2") + " — standardised coefficients", fontsize=10)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "coefficients.png")); plt.close(fig)

c, d = report["correct"], report["disengage"]
print(f"Model 1 P(correct):   Elo AUC {c['baseline_elo']['auc']:.3f} → logistic {c['logistic']['auc']:.3f} (GB {c['gradient_boosting']['auc']:.3f}); ECE {c['logistic']['ece']:.3f}")
print(f"Model 2 P(disengage): 1−focus AUC {d['baseline_1_minus_focus']['auc']:.3f} → logistic {d['logistic']['auc']:.3f} (GB {d['gradient_boosting']['auc']:.3f}); base rate {d['base_rate']:.3f}, threshold {best:.2f}")
print(f"done in {time.time() - t0:.1f}s → js/shared/model-weights.js, research/ml-report.json, research/figures/")
